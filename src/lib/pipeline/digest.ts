import { getDb } from "@/lib/db";
import { getRepoRows, getStartupRows } from "@/lib/queries";
import { getNotifiers, type DigestPayload } from "@/lib/notify";

/** 生成当日 digest（M1 Top3 + M2 Top3），落库并调用所有 Notifier。 */
export async function buildAndSendDigest(opts: { log?: (s: string) => void } = {}) {
  const log = opts.log ?? console.log;
  const db = getDb();
  const date = new Date().toISOString().slice(0, 10);

  const repos = getRepoRows({ limit: 3 });
  const startups = getStartupRows({ limit: 3 });

  const repoLines = repos.map((r, i) => {
    const reason = r.assessment?.one_liner ?? r.description ?? "";
    const why = r.signals?.breakout_flag ? "本周爆发" : `势能分 ${r.signals?.momentum_score ?? 0}`;
    return `${i + 1}. **[${r.full_name}](${r.url})** — ${reason}（${why}，评分 ${Math.round(
      r.assessment?.final_score ?? 0
    )}）`;
  });
  const startupLines = startups.map((s, i) => {
    return `${i + 1}. **[${s.name}](${s.url ?? "#"})** — ${s.assessment?.thesis?.slice(0, 60) ?? s.description ?? ""}（评分 ${Math.round(
      s.assessment?.final_score ?? 0
    )}）`;
  });

  const markdown = `## AI 前沿周报 · ${date}

**本周 Top3 开源项目**
${repoLines.join("\n") || "（暂无数据，请先运行采集）"}

**本周 Top3 Startup**
${startupLines.join("\n") || "（暂无数据）"}`;

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

  db.prepare(
    "INSERT OR REPLACE INTO digests (date,payload,delivered_to,created_at) VALUES (?,?,?,?)"
  ).run(date, JSON.stringify(payload), JSON.stringify(delivered), new Date().toISOString());

  log(`✅ digest ${date} 生成完毕，投递到 [${delivered.join(", ")}]`);
  return payload;
}
