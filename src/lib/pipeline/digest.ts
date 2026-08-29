import { getDb } from "@/lib/db";
import { getRepoRows, getStartupRows, repoDomainCounts } from "@/lib/queries";
import { getNotifiers, type DigestPayload } from "@/lib/notify";
import { getLLM } from "@/lib/llm";

/** 计数并排序（用于领域/子类/技术栈分布，喂给 LLM 做研判）。 */
function tally(items: (string | null | undefined)[]): { key: string; n: number }[] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = (it ?? "").trim();
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
}
const fmtCounts = (arr: { key: string; n: number }[], top = 6) =>
  arr.slice(0, top).map((x) => `${x.key}×${x.n}`).join("、") || "（暂无）";

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

  // 全景事实：领域分布 / 创业子类分布 / 在用技术栈分布，供 LLM 做「走向 AGI 的 bricks / 未被满足的需求」研判
  const landscapeStartups = getStartupRows({ limit: 40 });
  const domainDist = fmtCounts(repoDomainCounts());
  const subcatDist = fmtCounts(tally(landscapeStartups.map((s) => s.agent_subcategory)));
  const stackDist = fmtCounts(tally(landscapeStartups.flatMap((s) => s.tech_stack ?? [])), 8);
  const landscapeFacts = `开源项目领域分布：${domainDist}
创业公司方向分布：${subcatDist}
创业公司在用技术栈分布：${stackDist}`;

  let markdown = fallbackMarkdown(date, repoFacts, startupFacts);
  try {
    const system = `你是 AI 前沿情报主编，给专业读者写本周中文周报（markdown）。严格按下列结构与格式输出：

## AI 前沿周报 · ${date}
（第一行：一句话总览本周态势，点出方向/趋势）

**🔧 开源项目**
（每个项目**单独一行**，行首用 "- "，格式：- [名称](链接)（综合分x）：一句话说清是什么 + 为什么值得关注。**不要把多个项目挤在一行**。）

**🚀 创业公司**
（每家公司**单独一行**，行首用 "- "，格式同上：是什么方向 + 融资/信号 + 为什么有潜力。**一家一行**。）

**🔭 本周研判**
（一段 150–220 字的分析，必须回答三件事：① 本周火热的开源项目 + 当前流行于生产中的技术栈，正在补上哪些"走向 AGI 的 bricks"（如记忆/检索、工具与计算机操作、多 Agent 编排、后训练/RL、代码执行沙箱等，用给你的分布数据佐证）；② 这些拼图里还缺哪一块；③ 判定为有潜力的 startup 分别代表了哪些"尚未被满足的需求"。要有观点、能串成逻辑，不要复述前面的条目。）

硬性要求：只用我给你的事实，不许编造数字或公司；保留所有 markdown 链接；开源/创业每一项各占一行；全文控制在 ~500 字以内。`;
    const user = `本周 Top3 开源项目：\n${repoFacts || "（无）"}\n\n本周 Top3 创业公司：\n${startupFacts || "（无）"}\n\n全景分布（用于"研判"小节，不要逐条罗列，作为论据）：\n${landscapeFacts}`;
    const out = await getLLM().chat({
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      maxTokens: 8000, // k2.6 是推理模型，推理占用 token；周报变长（逐行 + 研判），给足额度避免截断
    });
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
  // repoFacts/startupFacts 已是「每行一项」，直接沿用（渲染器把 "1. "/"- " 视作列表行）
  return `## AI 前沿周报 · ${date}

**🔧 本周 Top3 开源项目**
${repoFacts || "（暂无数据，请先运行采集）"}

**🚀 本周 Top3 创业公司**
${startupFacts || "（暂无数据）"}`;
}
