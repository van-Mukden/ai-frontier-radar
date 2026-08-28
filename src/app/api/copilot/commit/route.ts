import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRepoMeta } from "@/lib/sources/github";
import { PROMPT_VERSION } from "@/lib/llm/provider";

/** Human-in-the-loop 写库：用户在拟入库卡片点「确认」后调用。source='copilot'。 */
export async function POST(req: Request) {
  let body: { kind?: string; fields?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { kind, fields } = body;
  if (!fields) return NextResponse.json({ error: "缺少字段" }, { status: 400 });
  const db = getDb();
  const now = new Date().toISOString();
  const num = (v: unknown, d = 0) => (typeof v === "number" ? v : d);
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  try {
    if (kind === "repo") {
      const full = str(fields.name);
      const meta = await getRepoMeta(full).catch(() => null);
      const id = meta?.id ?? Math.floor(Math.random() * 1e9) + 1e9; // 拉不到就给个本地 id
      const [owner, name] = full.includes("/") ? full.split("/") : ["", full];
      const sub = (fields.subscores ?? {}) as Record<string, number>;
      const potential = num(fields.potential_score);
      const momentum = num(sub.momentum);
      const final = 0.5 * potential + 0.35 * momentum;

      db.prepare(
        `INSERT INTO repos (id,name,owner,full_name,url,description,language,origin_lang,primary_domain,secondary_domains,topics,created_at,first_seen_at)
         VALUES (@id,@name,@owner,@full_name,@url,@description,@language,@origin_lang,@primary_domain,'[]','[]',@created_at,@first_seen_at)
         ON CONFLICT(id) DO UPDATE SET description=excluded.description, primary_domain=excluded.primary_domain, origin_lang=excluded.origin_lang`
      ).run({
        id,
        name: name || full,
        owner,
        full_name: full,
        url: str(fields.url) || meta?.html_url || `https://github.com/${full}`,
        description: str(fields.description) || meta?.description || "",
        language: meta?.language ?? null,
        origin_lang: str(fields.origin_lang) || "英文",
        primary_domain: str(fields.primary_domain) || "其他",
        created_at: meta?.created_at ?? now,
        first_seen_at: now,
      });
      db.prepare(
        `INSERT OR REPLACE INTO repo_snapshots (repo_id,ts,stars,forks,watchers,open_prs,contributors_30d,commits_7d,releases_90d)
         VALUES (?,?,?,?,?,?,?,?,?)`
      ).run(id, now, meta?.stargazers_count ?? num(fields.stars), meta?.forks_count ?? 0, 0, 0, 0, 0, 0);
      db.prepare(
        `INSERT OR REPLACE INTO repo_signals (repo_id,ts,stars,star_velocity_7d,star_accel,growth_rate,breakout_flag,corroboration_count,discussion_score,momentum_score)
         VALUES (?,?,?,0,0,0,0,0,0,?)`
      ).run(id, now, meta?.stargazers_count ?? num(fields.stars), momentum);
      db.prepare(
        `INSERT OR REPLACE INTO repo_assessments (repo_id,prompt_version,provider,potential_score,subscores,one_liner,thesis,risks,comparable_to,final_score,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        id,
        PROMPT_VERSION,
        "copilot",
        potential,
        JSON.stringify(fields.subscores ?? {}),
        str(fields.one_liner),
        str(fields.thesis),
        JSON.stringify(fields.risks ?? []),
        "",
        final,
        now
      );
      return NextResponse.json({ ok: true, entity: "repo", id, href: `/projects/${id}` });
    }

    if (kind === "startup") {
      const sub = (fields.subscores ?? {}) as Record<string, number>;
      const potential = num(fields.potential_score);
      const momentum = Math.round((num(sub.funding_signal) + num(sub.traction)) / 2);
      const final = 0.6 * potential + 0.4 * momentum;
      const row = db
        .prepare(
          `INSERT INTO startups (name,url,batch,region,hq,agent_subcategory,tech_stack,description,first_seen_at,source)
           VALUES (@name,@url,NULL,@region,@region,@agent_subcategory,@tech_stack,@description,@first_seen_at,'copilot')
           ON CONFLICT(name) DO UPDATE SET url=excluded.url, description=excluded.description, region=excluded.region,
             agent_subcategory=excluded.agent_subcategory, tech_stack=excluded.tech_stack, source='copilot'
           RETURNING id`
        )
        .get({
          name: str(fields.name),
          url: str(fields.url),
          region: str(fields.region) || "美国",
          agent_subcategory: str(fields.agent_subcategory) || "其他",
          tech_stack: JSON.stringify(fields.tech_stack ?? []),
          description: str(fields.description),
          first_seen_at: now,
        }) as { id: number };
      db.prepare(
        `INSERT OR REPLACE INTO startup_assessments (startup_id,prompt_version,provider,potential_score,momentum_score,subscores,fourc,thesis,risks,final_score,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        row.id,
        PROMPT_VERSION,
        "copilot",
        potential,
        momentum,
        JSON.stringify(fields.subscores ?? {}),
        JSON.stringify(fields.fourc ?? {}),
        str(fields.thesis),
        JSON.stringify(fields.risks ?? []),
        final,
        now
      );
      return NextResponse.json({ ok: true, entity: "startup", id: row.id, href: `/startups/${row.id}` });
    }

    return NextResponse.json({ error: "未知类型" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
