import { getDb } from "@/lib/db";
import { STARTUP_SEED, type SeedStartup } from "./startupSeed";
import { frontpageAIStories, launchShowHNCandidates } from "@/lib/sources/hackernews";
import { fetchYCAgentStartups } from "@/lib/sources/yc";
import { getLLM, providerName } from "@/lib/llm";
import { StartupAssessmentSchema, HNExtractSchema, PROMPT_VERSION } from "@/lib/llm/provider";
import { startupAssessPrompt, hnExtractPrompt } from "@/lib/llm/prompts";
import { INVESTOR_TIERS, DISCOVER } from "@/config/scoring";

type Round = SeedStartup["rounds"][number];

function investorScore(rounds: { lead_investors: string[] }[]): number {
  let best = 0;
  for (const r of rounds)
    for (const inv of r.lead_investors) best = Math.max(best, INVESTOR_TIERS[inv.toLowerCase()] ?? 0.4);
  return Math.round(best * 100);
}

function roundVelocityScore(rounds: { date: string | null; amount_usd: number | null }[]): number {
  const sorted = rounds.filter((r) => r.date).sort((a, b) => (a.date! < b.date! ? -1 : 1));
  if (sorted.length < 2) return 40;
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const months = (new Date(last.date!).getTime() - new Date(prev.date!).getTime()) / (30 * 864e5);
  const speed = months <= 9 ? 90 : months <= 15 ? 65 : 45;
  const jump = last.amount_usd && prev.amount_usd ? Math.min(last.amount_usd / prev.amount_usd, 5) / 5 : 0.4;
  return Math.round(0.6 * speed + 0.4 * jump * 100);
}

const norm = (s: string) => s.toLowerCase().replace(/\s+|[.,/#!$%^&*;:{}=\-_`~()]/g, "");

interface Candidate {
  name: string;
  url: string;
  region: "中国" | "美国" | "日本";
  batch: string | null;
  agent_subcategory: string | null;
  description: string;
  source: string;
  rounds: Round[];
}

export async function ingestStartups(
  opts: { log?: (s: string) => void; ycLimit?: number; hnLimit?: number } = {}
) {
  const log = opts.log ?? console.log;
  const db = getDb();
  const nowIso = new Date().toISOString();
  const llm = getLLM();

  const upsertStartup = db.prepare(`
    INSERT INTO startups (name,url,batch,region,hq,agent_subcategory,tech_stack,description,first_seen_at,source)
    VALUES (@name,@url,@batch,@region,@hq,@agent_subcategory,@tech_stack,@description,@first_seen_at,@source)
    ON CONFLICT(name) DO UPDATE SET url=excluded.url, description=excluded.description,
      region=excluded.region, agent_subcategory=excluded.agent_subcategory,
      tech_stack=excluded.tech_stack, batch=excluded.batch, source=excluded.source
    RETURNING id, first_seen_at
  `);
  const insRound = db.prepare(`
    INSERT INTO funding_rounds (startup_id,stage,amount_usd,date,lead_investors,all_investors,source_url)
    VALUES (@startup_id,@stage,@amount_usd,@date,@lead_investors,@all_investors,@source_url)
  `);
  const clearRounds = db.prepare("DELETE FROM funding_rounds WHERE startup_id = ?");
  const insAssess = db.prepare(`
    INSERT OR REPLACE INTO startup_assessments (startup_id,prompt_version,provider,potential_score,momentum_score,subscores,fourc,thesis,risks,final_score,created_at)
    VALUES (@startup_id,@prompt_version,@provider,@potential_score,@momentum_score,@subscores,@fourc,@thesis,@risks,@final_score,@created_at)
  `);

  async function assessAndStore(c: Candidate): Promise<boolean> {
    const invScore = investorScore(c.rounds);
    const velScore = roundVelocityScore(c.rounds);
    const fundingNote =
      c.rounds
        .map((r) => `${r.stage} ${r.amount_usd ? "$" + (r.amount_usd / 1e6).toFixed(0) + "M" : ""} 领投 ${r.lead_investors.join("/")}`)
        .join("; ") || "（暂无公开融资记录）";

    const assess = await llm.completeJSON({
      ...startupAssessPrompt({
        name: c.name,
        description: c.description,
        region: c.region,
        batch: c.batch,
        fundingNote,
        tractionNote: `投资方声誉分 ${invScore}，轮次速度分 ${velScore}`,
        newsExcerpt: c.description,
      }),
      schema: StartupAssessmentSchema,
    });

    const row = upsertStartup.get({
      name: c.name,
      url: c.url,
      batch: c.batch,
      region: c.region,
      hq: c.region,
      agent_subcategory: c.agent_subcategory ?? assess.agent_subcategory,
      tech_stack: JSON.stringify(assess.tech_stack),
      description: c.description,
      first_seen_at: nowIso,
      source: c.source,
    }) as { id: number };
    const startup_id = row.id;

    clearRounds.run(startup_id);
    for (const r of c.rounds) {
      insRound.run({
        startup_id,
        stage: r.stage,
        amount_usd: r.amount_usd,
        date: r.date,
        lead_investors: JSON.stringify(r.lead_investors),
        all_investors: JSON.stringify(r.lead_investors),
        source_url: r.source_url,
      });
    }

    const momentum_score = Math.round(0.5 * velScore + 0.5 * invScore);
    const final_score = 0.6 * assess.potential_score + 0.4 * momentum_score;
    insAssess.run({
      startup_id,
      prompt_version: PROMPT_VERSION,
      provider: providerName(),
      potential_score: assess.potential_score,
      momentum_score,
      subscores: JSON.stringify(assess.subscores),
      fourc: JSON.stringify(assess.fourc),
      thesis: assess.thesis,
      risks: JSON.stringify(assess.risks),
      final_score,
      created_at: nowIso,
    });
    return true;
  }

  const processed = new Set<string>();
  let n = 0;

  // 1) 少量旗舰种子（非 YC 的知名公司，带真实融资口径）
  log("旗舰种子…");
  for (const seed of STARTUP_SEED) {
    processed.add(norm(seed.name));
    try {
      await assessAndStore({
        name: seed.name,
        url: seed.url,
        region: seed.region,
        batch: null,
        agent_subcategory: seed.agent_subcategory,
        description: seed.description,
        source: "curated",
        rounds: seed.rounds,
      });
      log(`  • ${seed.name} (${seed.region})`);
      n++;
    } catch (e) {
      log(`  ✗ ${seed.name}: ${(e as Error).message.slice(0, 100)}`);
    }
  }

  // 2) YC 公司库（结构化、每周更新，识别不用 LLM）
  log("YC 公司库发现…");
  try {
    const yc = await fetchYCAgentStartups(opts.ycLimit ?? DISCOVER.ycLimit);
    log(`  YC 命中 ${yc.length} 家 Agent 方向候选`);
    for (const c of yc) {
      if (processed.has(norm(c.name))) continue;
      processed.add(norm(c.name));
      try {
        await assessAndStore({
          name: c.name,
          url: c.url,
          region: c.region,
          batch: c.batch,
          agent_subcategory: null,
          description: c.description,
          source: "yc",
          rounds: [],
        });
        log(`  • ${c.name} (${c.region}, ${c.batch})`);
        n++;
      } catch (e) {
        log(`  ✗ ${c.name}: ${(e as Error).message.slice(0, 100)}`);
      }
    }
  } catch (e) {
    log(`  YC 发现失败: ${(e as Error).message.slice(0, 100)}`);
  }

  // 3) HN Launch/Show HN → LLM 抽取公司
  log("HN Launch/Show HN 发现…");
  try {
    const hits = await launchShowHNCandidates();
    let done = 0;
    for (const h of hits) {
      if (done >= (opts.hnLimit ?? DISCOVER.hnLimit)) break;
      try {
        const ex = await llm.completeJSON({
          ...hnExtractPrompt({
            title: h.title,
            url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
            text: h.story_text ?? h.title,
          }),
          schema: HNExtractSchema,
        });
        done++;
        if (!ex.is_agent_startup || ex.region === "其他") continue;
        if (processed.has(norm(ex.name))) continue;
        processed.add(norm(ex.name));
        await assessAndStore({
          name: ex.name,
          url: ex.url || h.url || "",
          region: ex.region,
          batch: null,
          agent_subcategory: ex.agent_subcategory,
          description: ex.description,
          source: "hn",
          rounds: [],
        });
        log(`  • ${ex.name} (${ex.region}) [HN]`);
        n++;
      } catch (e) {
        log(`  ✗ HN "${h.title.slice(0, 40)}": ${(e as Error).message.slice(0, 80)}`);
      }
    }
  } catch (e) {
    log(`  HN 发现失败: ${(e as Error).message.slice(0, 100)}`);
  }

  // 4) HN AI 讨论热帖 → 增量发现池（mentions）
  try {
    const stories = await frontpageAIStories();
    const insMention = db.prepare(`
      INSERT OR IGNORE INTO mentions (entity_type,entity_id,source,url,title,score,num_comments,sentiment,ts)
      VALUES ('startup',@entity_id,'hackernews',@url,@title,@score,@num_comments,0,@ts)
    `);
    for (const s of stories.slice(0, 20)) {
      insMention.run({
        entity_id: "_hn_discovery",
        url: s.url ?? `https://news.ycombinator.com/item?id=${s.objectID}`,
        title: s.title,
        score: s.points,
        num_comments: s.num_comments,
        ts: s.created_at,
      });
    }
  } catch {
    /* 非致命 */
  }

  log(`✅ M2 完成：${n} 家公司入库/评估（provider=${providerName()}）`);
  return { startups: n };
}
