import { getDb } from "@/lib/db";
import {
  searchNewAIRepos,
  getReadme,
  getContributorsCount,
  starVelocityFromStargazers,
  listRootTree,
  rateLimitRemaining,
} from "@/lib/sources/github";
import { searchHN } from "@/lib/sources/hackernews";
import { computeRepoSignals } from "@/lib/signals/repoSignals";
import { staticAuthenticityCheck } from "@/lib/signals/authenticity";
import { getLLM, providerName } from "@/lib/llm";
import {
  RepoClassificationSchema,
  RepoAssessmentSchema,
  PROMPT_VERSION,
} from "@/lib/llm/provider";
import { repoClassifyPrompt, repoAssessPrompt } from "@/lib/llm/prompts";
import { CORROBORATION_THRESHOLDS, M1_WEIGHTS, SUSPICIOUS_PENALTY } from "@/config/scoring";

function detectOriginLang(readme: string, description: string | null): "中文" | "英文" | "其他" {
  const sample = (readme.slice(0, 2000) + (description ?? "")).slice(0, 2500);
  const cjk = (sample.match(/[一-鿿]/g) ?? []).length;
  const latin = (sample.match(/[a-zA-Z]/g) ?? []).length;
  if (cjk > 30 && cjk > latin * 0.15) return "中文";
  if (latin > 0) return "英文";
  return "其他";
}

export async function ingestRepos(opts: { enrichCap?: number; log?: (s: string) => void } = {}) {
  const log = opts.log ?? console.log;
  const enrichCap = opts.enrichCap ?? 15;
  const db = getDb();
  const nowIso = new Date().toISOString();

  log("🔎 GitHub 搜索近期 AI 新仓库…");
  const repos = await searchNewAIRepos();
  log(`  命中 ${repos.length} 个候选，取前 ${enrichCap} 个做富化`);

  const upsertRepo = db.prepare(`
    INSERT INTO repos (id,name,owner,full_name,url,description,language,origin_lang,primary_domain,secondary_domains,topics,created_at,first_seen_at)
    VALUES (@id,@name,@owner,@full_name,@url,@description,@language,@origin_lang,@primary_domain,@secondary_domains,@topics,@created_at,@first_seen_at)
    ON CONFLICT(id) DO UPDATE SET
      description=excluded.description, language=excluded.language,
      origin_lang=excluded.origin_lang, primary_domain=excluded.primary_domain,
      secondary_domains=excluded.secondary_domains, topics=excluded.topics
  `);
  const insSnapshot = db.prepare(`
    INSERT OR REPLACE INTO repo_snapshots (repo_id,ts,stars,forks,watchers,open_prs,contributors_30d,commits_7d,releases_90d)
    VALUES (@repo_id,@ts,@stars,@forks,@watchers,@open_prs,@contributors_30d,@commits_7d,@releases_90d)
  `);
  const insSignals = db.prepare(`
    INSERT OR REPLACE INTO repo_signals (repo_id,ts,stars,star_velocity_7d,star_accel,growth_rate,breakout_flag,corroboration_count,discussion_score,momentum_score)
    VALUES (@repo_id,@ts,@stars,@star_velocity_7d,@star_accel,@growth_rate,@breakout_flag,@corroboration_count,@discussion_score,@momentum_score)
  `);
  const insAssess = db.prepare(`
    INSERT OR REPLACE INTO repo_assessments (repo_id,prompt_version,provider,potential_score,subscores,one_liner,thesis,risks,comparable_to,final_score,created_at)
    VALUES (@repo_id,@prompt_version,@provider,@potential_score,@subscores,@one_liner,@thesis,@risks,@comparable_to,@final_score,@created_at)
  `);
  const insAuth = db.prepare(`
    INSERT OR REPLACE INTO repo_authenticity (repo_id,label,evidence,flags,checked_at)
    VALUES (@repo_id,@label,@evidence,@flags,@checked_at)
  `);
  const insMention = db.prepare(`
    INSERT OR IGNORE INTO mentions (entity_type,entity_id,source,url,title,score,num_comments,sentiment,ts)
    VALUES ('repo',@entity_id,@source,@url,@title,@score,@num_comments,@sentiment,@ts)
  `);

  const llm = getLLM();
  let enriched = 0;

  for (const r of repos.slice(0, enrichCap)) {
    try {
      const rl = await rateLimitRemaining();
      if (rl < 6) {
        log(`  ⚠️ GitHub 速率将耗尽（剩 ${rl}），停止富化。配置 GITHUB_TOKEN 可拉满。`);
        break;
      }
      log(`  • ${r.full_name} (★${r.stargazers_count})`);

      const readme = await getReadme(r.full_name);
      const tree = await listRootTree(r.full_name);
      const contributors = await getContributorsCount(r.full_name);

      // ---- 跨源印证：HN ----
      const shortName = r.name;
      const hnHits = await searchHN(shortName);
      let corroboration = 0;
      const platforms = new Set<string>();
      for (const h of hnHits) {
        if (h.points >= CORROBORATION_THRESHOLDS.hackernews) platforms.add("hackernews");
        insMention.run({
          entity_id: r.full_name,
          source: "hackernews",
          url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
          title: h.title,
          score: h.points,
          num_comments: h.num_comments,
          sentiment: 0,
          ts: h.created_at,
        });
      }
      corroboration = platforms.size;

      // ---- star 速度（stargazer 时间戳回填）----
      const vel = await starVelocityFromStargazers(r.full_name, r.stargazers_count);
      const gained7d = vel?.gained7d ?? 0;
      const gainedPrev7d = vel?.gainedPrev7d ?? 0;

      const sig = computeRepoSignals({
        stars: r.stargazers_count,
        gained7d,
        gainedPrev7d,
        corroborationCount: corroboration,
        discussionScore: hnHits.reduce((a, h) => a + h.points, 0),
      });

      // ---- 静态真实性核查 ----
      const auth = staticAuthenticityCheck({
        full_name: r.full_name,
        description: r.description,
        readme,
        tree,
        stars: r.stargazers_count,
        contributors,
        gained7d,
      });
      const suspicious = auth.label === "可疑·充数";

      // ---- LLM 分类 ----
      let origin_lang = detectOriginLang(readme, r.description);
      let primary_domain = "其他";
      let secondary: string[] = [];
      try {
        const cls = await llm.completeJSON({
          ...repoClassifyPrompt({
            full_name: r.full_name,
            description: r.description,
            language: r.language,
            topics: r.topics,
            readmeExcerpt: readme,
          }),
          schema: RepoClassificationSchema,
        });
        origin_lang = cls.origin_lang;
        primary_domain = cls.primary_domain;
        secondary = cls.secondary_domains;
      } catch (e) {
        log(`    分类失败(降级本地推断): ${(e as Error).message.slice(0, 80)}`);
      }

      // ---- LLM 评估 ----
      const assess = await llm.completeJSON({
        ...repoAssessPrompt({
          full_name: r.full_name,
          description: r.description,
          primary_domain,
          signals: {
            stars: r.stargazers_count,
            star_velocity_7d: sig.star_velocity_7d,
            growth_rate: sig.growth_rate,
            corroboration_count: corroboration,
            breakout_flag: sig.breakout_flag,
          },
          contributorsNote: `${contributors} 位贡献者`,
          topMentions: hnHits.map((h) => `${h.title} (${h.points}分)`),
          readmeExcerpt: readme,
          suspicious,
        }),
        schema: RepoAssessmentSchema,
      });

      let potential = assess.potential_score;
      if (suspicious) potential = Math.max(0, potential - SUSPICIOUS_PENALTY);
      const corrNorm = Math.min(corroboration / 3, 1) * 100;
      const final_score =
        M1_WEIGHTS.potential * potential +
        M1_WEIGHTS.momentum * sig.momentum_score +
        M1_WEIGHTS.corroboration * corrNorm;

      // ---- 落库 ----
      const tx = db.transaction(() => {
        upsertRepo.run({
          id: r.id,
          name: r.name,
          owner: r.owner.login,
          full_name: r.full_name,
          url: r.html_url,
          description: r.description,
          language: r.language,
          origin_lang,
          primary_domain,
          secondary_domains: JSON.stringify(secondary),
          topics: JSON.stringify(r.topics),
          created_at: r.created_at,
          first_seen_at: nowIso,
        });
        insSnapshot.run({
          repo_id: r.id,
          ts: nowIso,
          stars: r.stargazers_count,
          forks: r.forks_count,
          watchers: r.watchers_count,
          open_prs: r.open_issues_count,
          contributors_30d: contributors,
          commits_7d: gained7d, // 近似占位
          releases_90d: 0,
        });
        insSignals.run({
          repo_id: r.id,
          ts: nowIso,
          stars: r.stargazers_count,
          star_velocity_7d: sig.star_velocity_7d,
          star_accel: sig.star_accel,
          growth_rate: sig.growth_rate,
          breakout_flag: sig.breakout_flag,
          corroboration_count: corroboration,
          discussion_score: hnHits.reduce((a, h) => a + h.points, 0),
          momentum_score: sig.momentum_score,
        });
        insAuth.run({
          repo_id: r.id,
          label: auth.label,
          evidence: JSON.stringify(auth.evidence),
          flags: JSON.stringify(auth.flags),
          checked_at: nowIso,
        });
        insAssess.run({
          repo_id: r.id,
          prompt_version: PROMPT_VERSION,
          provider: providerName(),
          potential_score: potential,
          subscores: JSON.stringify(assess.subscores),
          one_liner: assess.one_liner,
          thesis: assess.thesis,
          risks: JSON.stringify(assess.risks),
          comparable_to: assess.comparable_to,
          final_score,
          created_at: nowIso,
        });
      });
      tx();
      enriched++;
    } catch (e) {
      log(`    ✗ ${r.full_name} 富化失败: ${(e as Error).message.slice(0, 120)}`);
    }
  }

  log(`✅ M1 完成：富化 ${enriched} 个仓库（provider=${providerName()}）`);
  return { candidates: repos.length, enriched };
}
