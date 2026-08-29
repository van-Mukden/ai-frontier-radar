import { getDb } from "@/lib/db";
import { getRepoRows, getStartupRows } from "@/lib/queries";
import { getNotifiers, type DigestPayload } from "@/lib/notify";
import { getLLM } from "@/lib/llm";

/** 生成当周 digest（Top3 开源 + Top3 startup），由 LLM 写成通顺短周报，落库并调 Notifier。 */
export async function buildAndSendDigest(opts: { log?: (s: string) => void } = {}) {
  const log = opts.log ?? console.log;
  const db = getDb();
  const date = new Date().toISOString().slice(0, 10);

  const repos = getRepoRows({ limit: 3 });
  const startups = getStartupRows({ limit: 3 });

  // 给 LLM 的事实块（含链接与关键信号，供其成文，不许编数字）
  const repoFacts = repos
    .map((r, i) => {
      const why = r.signals?.breakout_flag
        ? "本周爆发"
        : `势能 ${r.signals?.momentum_score ?? 0}、跨源印证 ${r.signals?.corroboration_count ?? 0} 源`;
      return `${i + 1}. [${r.full_name}](${r.url}) | ${r.primary_domain ?? ""} | ${r.assessment?.one_liner ?? r.description ?? ""} | 综合分 ${Math.round(
        r.assessment?.final_score ?? 0
      )}（${why}）`;
    })
    .join("\n");
  const startupFacts = startups
    .map((s, i) => {
      const latest = s.rounds[s.rounds.length - 1];
      const fund = latest
        ? `${latest.stage}${latest.amount_usd ? " $" + (latest.amount_usd / 1e6).toFixed(0) + "M" : ""}`
        : "融资未公开";
      return `${i + 1}. [${s.name}](${s.url ?? "#"}) | ${s.region} · ${s.agent_subcategory ?? ""} | ${s.assessment?.thesis ?? s.description ?? ""} | 综合分 ${Math.round(
        s.assessment?.final_score ?? 0
      )}（${fund}）`;
    })
    .join("\n");

  let markdown = fallbackMarkdown(date, repoFacts, startupFacts);
  try {
    const system = `你是 AI 前沿情报编辑。把本周榜单写成一段**通顺、有逻辑、简短**的中文周报（markdown）。要求：
- 开头一句话总览本周态势（能点出方向/趋势更好）。
- 分「🔧 开源项目」「🚀 创业公司」两小节，每个上榜项一句话：是什么 + 为什么值得关注（结合它的分数/信号），可做轻微横向对比。
- 像一篇小快讯，不要罗列式堆砌。保留每个名称的 markdown 链接。
- 只用给你的事实，不许编造数字。全文控制在 ~220 字。标题用 "## AI 前沿周报 · ${date}"。`;
    const user = `本周 Top3 开源项目：\n${repoFacts || "（无）"}\n\n本周 Top3 创业公司：\n${startupFacts || "（无）"}`;
    const out = await getLLM().chat({ messages: [{ role: "system", content: system }, { role: "user", content: user }] });
    if (out && out.trim().length > 20) markdown = out.trim();
  } catch (e) {
    log(`  周报 LLM 撰写失败，用模板兜底: ${(e as Error).message.slice(0, 80)}`);
  }

  const payload: DigestPayload = {
    date,
    markdown,
    repos: repos.map((r) => ({ name: r.full_name, url: r.url, reason: r.assessment?.one_liner ?? "" })),
    startups: startups.map((s) => ({ name: s.name, url: s.url ?? "#", reason: s.assessment?.thesis ?? "" })),
  };

  const notifiers = getNotifiers();
  const delivered: string[] = [];
  for (const n of notifiers) {
    const res = await n.send(payload);
    log(`  推送[${n.name}]: ${res.detail}`);
    if (res.ok) delivered.push(n.name);
  }

  db.prepare("INSERT OR REPLACE INTO digests (date,payload,delivered_to,created_at) VALUES (?,?,?,?)").run(
    date,
    JSON.stringify(payload),
    JSON.stringify(delivered),
    new Date().toISOString()
  );
  log(`✅ 周报 ${date} 生成完毕，投递到 [${delivered.join(", ")}]`);
  return payload;
}

function fallbackMarkdown(date: string, repoFacts: string, startupFacts: string): string {
  return `## AI 前沿周报 · ${date}

**🔧 本周 Top3 开源项目**
${repoFacts || "（暂无数据，请先运行采集）"}

**🚀 本周 Top3 创业公司**
${startupFacts || "（暂无数据）"}`;
}
