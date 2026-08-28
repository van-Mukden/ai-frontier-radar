import { getDb } from "./db";
import { INVESTOR_TIERS } from "@/config/scoring";
import type {
  Repo,
  RepoSignals,
  RepoAssessment,
  RepoAuthenticity,
  Mention,
  Startup,
  FundingRound,
  StartupAssessment,
} from "./types";

const j = (s: unknown, fallback: unknown = []) => {
  try {
    return JSON.parse((s as string) ?? "");
  } catch {
    return fallback;
  }
};

// ---------- 组合视图 ----------
export interface RepoRow extends Repo {
  signals?: RepoSignals;
  assessment?: RepoAssessment;
  authenticity?: RepoAuthenticity;
  mentions: Mention[];
}

export type RepoSort = "score" | "momentum" | "velocity" | "stars";

export function getRepoRows(opts: {
  origin_lang?: string;
  domain?: string;
  breakoutOnly?: boolean;
  minStars?: number;
  minScore?: number;
  hasCorroboration?: boolean;
  hideSuspicious?: boolean;
  sinceDays?: number;
  sort?: RepoSort;
  limit?: number;
} = {}): RepoRow[] {
  const db = getDb();

  const where: string[] = ["1=1"];
  const params: Record<string, unknown> = { limit: opts.limit ?? 200 };
  if (opts.origin_lang) {
    where.push("r.origin_lang = @origin_lang");
    params.origin_lang = opts.origin_lang;
  }
  if (opts.domain) {
    where.push("r.primary_domain = @domain");
    params.domain = opts.domain;
  }
  if (opts.breakoutOnly) where.push("s.breakout_flag = 1");
  if (opts.minStars != null) {
    where.push("COALESCE(s.stars,0) >= @minStars");
    params.minStars = opts.minStars;
  }
  if (opts.minScore != null) {
    where.push("COALESCE(a.final_score,0) >= @minScore");
    params.minScore = opts.minScore;
  }
  if (opts.hasCorroboration) where.push("COALESCE(s.corroboration_count,0) > 0");
  if (opts.hideSuspicious) where.push("(au.label IS NULL OR au.label != '可疑·充数')");
  if (opts.sinceDays != null) {
    where.push("r.created_at >= @sinceDate");
    params.sinceDate = new Date(Date.now() - opts.sinceDays * 864e5).toISOString();
  }

  const orderMap: Record<RepoSort, string> = {
    score: "COALESCE(a.final_score, s.momentum_score, 0)",
    momentum: "COALESCE(s.momentum_score, 0)",
    velocity: "COALESCE(s.star_velocity_7d, 0)",
    stars: "COALESCE(s.stars, 0)",
  };
  const orderExpr = orderMap[opts.sort ?? "score"];

  const rows = db
    .prepare(
      `SELECT r.*, a.final_score AS _final
       FROM repos r
       LEFT JOIN repo_assessments a ON a.repo_id = r.id
       LEFT JOIN repo_signals s ON s.repo_id = r.id
       LEFT JOIN repo_authenticity au ON au.repo_id = r.id
       WHERE ${where.join(" AND ")}
       ORDER BY ${orderExpr} DESC
       LIMIT @limit`
    )
    .all(params) as (Repo & { _final: number })[];

  return rows.map((r) => hydrateRepo(r.id, r));
}

export function getRepo(id: number): RepoRow | null {
  const db = getDb();
  const r = db.prepare("SELECT * FROM repos WHERE id = ?").get(id) as Repo | undefined;
  if (!r) return null;
  return hydrateRepo(id, r);
}

function hydrateRepo(id: number, base: Repo): RepoRow {
  const db = getDb();
  const s = db.prepare("SELECT * FROM repo_signals WHERE repo_id = ?").get(id) as
    | RepoSignals
    | undefined;
  const aRaw = db.prepare("SELECT * FROM repo_assessments WHERE repo_id = ?").get(id) as
    | (RepoAssessment & { subscores: string; risks: string })
    | undefined;
  const authRaw = db.prepare("SELECT * FROM repo_authenticity WHERE repo_id = ?").get(id) as
    | (RepoAuthenticity & { evidence: string; flags: string })
    | undefined;
  const mentions = db
    .prepare("SELECT * FROM mentions WHERE entity_type='repo' AND entity_id = ? ORDER BY score DESC")
    .all(base.full_name) as Mention[];

  return {
    ...base,
    secondary_domains: j(base.secondary_domains as unknown),
    topics: j(base.topics as unknown),
    signals: s,
    assessment: aRaw
      ? { ...aRaw, subscores: j(aRaw.subscores, {}), risks: j(aRaw.risks) }
      : undefined,
    authenticity: authRaw
      ? { ...authRaw, evidence: j(authRaw.evidence), flags: j(authRaw.flags) }
      : undefined,
    mentions,
  };
}

export function getRepoSnapshots(repoId: number): { ts: string; stars: number }[] {
  const db = getDb();
  return db
    .prepare("SELECT ts, stars FROM repo_snapshots WHERE repo_id = ? ORDER BY ts")
    .all(repoId) as { ts: string; stars: number }[];
}

/** 领域内排名（PRD §6.6）。 */
export function getDomainRankings(): { domain: string; repos: RepoRow[] }[] {
  const db = getDb();
  const domains = db
    .prepare("SELECT DISTINCT primary_domain d FROM repos WHERE primary_domain IS NOT NULL")
    .all() as { d: string }[];
  return domains
    .map(({ d }) => ({ domain: d, repos: getRepoRows({ domain: d, limit: 5 }) }))
    .filter((g) => g.repos.length > 0)
    .sort((a, b) => (b.repos[0]?.assessment?.final_score ?? 0) - (a.repos[0]?.assessment?.final_score ?? 0));
}

// ---------- Startups ----------
export interface StartupRow extends Startup {
  rounds: FundingRound[];
  assessment?: StartupAssessment;
}

export type StartupSort = "score" | "momentum" | "funding";

export function getStartupRows(opts: {
  region?: string;
  subcategory?: string;
  stage?: string;
  topTierOnly?: boolean;
  sort?: StartupSort;
  limit?: number;
} = {}): StartupRow[] {
  const db = getDb();
  const where: string[] = ["1=1"];
  const params: Record<string, unknown> = {};
  if (opts.region) {
    where.push("st.region = @region");
    params.region = opts.region;
  }
  if (opts.subcategory) {
    where.push("st.agent_subcategory = @subcategory");
    params.subcategory = opts.subcategory;
  }
  const base = db
    .prepare(`SELECT st.* FROM startups st WHERE ${where.join(" AND ")}`)
    .all(params) as Startup[];

  let rows = base.map((s) => hydrateStartup(s.id, s));

  // JS 后处理：融资阶段 / 顶级投资方 / 排序（融资数据是 JSON，SQL 里不好过滤）
  if (opts.stage) {
    rows = rows.filter((r) => r.rounds.some((rd) => (rd.stage ?? "").includes(opts.stage!)));
  }
  if (opts.topTierOnly) {
    rows = rows.filter((r) =>
      r.rounds.some((rd) => rd.lead_investors.some((inv) => (INVESTOR_TIERS[inv.toLowerCase()] ?? 0) >= 0.9))
    );
  }
  const totalRaised = (r: StartupRow) => r.rounds.reduce((t, x) => t + (x.amount_usd ?? 0), 0);
  const key = (r: StartupRow) =>
    opts.sort === "momentum"
      ? r.assessment?.momentum_score ?? 0
      : opts.sort === "funding"
      ? totalRaised(r)
      : r.assessment?.final_score ?? 0;
  rows.sort((a, b) => key(b) - key(a));
  return rows.slice(0, opts.limit ?? 200);
}

export function getStartup(id: number): StartupRow | null {
  const db = getDb();
  const s = db.prepare("SELECT * FROM startups WHERE id = ?").get(id) as Startup | undefined;
  if (!s) return null;
  return hydrateStartup(id, s);
}

function hydrateStartup(id: number, base: Startup): StartupRow {
  const db = getDb();
  const rounds = (
    db.prepare("SELECT * FROM funding_rounds WHERE startup_id = ? ORDER BY date").all(id) as (FundingRound & {
      lead_investors: string;
      all_investors: string;
    })[]
  ).map((r) => ({ ...r, lead_investors: j(r.lead_investors), all_investors: j(r.all_investors) }));
  const aRaw = db.prepare("SELECT * FROM startup_assessments WHERE startup_id = ?").get(id) as
    | (StartupAssessment & { subscores: string; fourc: string; risks: string })
    | undefined;
  return {
    ...base,
    tech_stack: j(base.tech_stack as unknown),
    rounds,
    assessment: aRaw
      ? { ...aRaw, subscores: j(aRaw.subscores, {}), fourc: j(aRaw.fourc, {}), risks: j(aRaw.risks) }
      : undefined,
  };
}

// ---------- 关系图谱 ----------
export interface GraphNode {
  id: number;
  name: string;
  region: string | null;
  business: string | null;
  tech: string[];
  score: number;
}
export interface GraphLink {
  source: number;
  target: number;
  kind: "business" | "tech";
  label: string;
}
export interface StartupGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * 选中的 top startups 构成的关系图：
 * 业务领域相同 → 实线(business)；技术栈有交集 → 虚线(tech)。
 */
export function getStartupGraph(opts: { region?: string; topN?: number } = {}): StartupGraphData {
  const rows = getStartupRows({ region: opts.region, limit: opts.topN ?? 12 });
  const nodes: GraphNode[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    region: s.region,
    business: s.agent_subcategory,
    tech: s.tech_stack ?? [],
    score: s.assessment?.final_score ?? 0,
  }));

  const links: GraphLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let k = i + 1; k < nodes.length; k++) {
      const a = nodes[i];
      const b = nodes[k];
      if (a.business && b.business && a.business === b.business) {
        links.push({ source: a.id, target: b.id, kind: "business", label: a.business });
      }
      const sharedTech = a.tech.filter((t) => b.tech.includes(t));
      if (sharedTech.length > 0) {
        links.push({ source: a.id, target: b.id, kind: "tech", label: sharedTech.join("、") });
      }
    }
  }
  return { nodes, links };
}

// ---------- digest ----------
export function getLatestDigest(): { date: string; payload: unknown } | null {
  const db = getDb();
  const row = db.prepare("SELECT date, payload FROM digests ORDER BY date DESC LIMIT 1").get() as
    | { date: string; payload: string }
    | undefined;
  if (!row) return null;
  return { date: row.date, payload: j(row.payload, {}) };
}

export function counts() {
  const db = getDb();
  const c = (t: string) => (db.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as { n: number }).n;
  return {
    repos: c("repos"),
    startups: c("startups"),
    mentions: c("mentions"),
    assessed: c("repo_assessments"),
    breakouts: (db.prepare("SELECT COUNT(*) n FROM repo_signals WHERE breakout_flag=1").get() as { n: number }).n,
  };
}

/** 开源项目按领域计数（数据可视化用）。 */
export function repoDomainCounts(): { key: string; n: number }[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT primary_domain key, COUNT(*) n FROM repos WHERE primary_domain IS NOT NULL GROUP BY primary_domain ORDER BY n DESC"
    )
    .all() as { key: string; n: number }[];
}

/** 公司按地域计数（数据可视化用）。 */
export function startupRegionCounts(): { key: string; n: number }[] {
  const db = getDb();
  return db
    .prepare("SELECT region key, COUNT(*) n FROM startups WHERE region IS NOT NULL GROUP BY region ORDER BY n DESC")
    .all() as { key: string; n: number }[];
}

/** 公司来源计数（YC / HN / 旗舰）。 */
export function startupSourceCounts(): { key: string; n: number }[] {
  const db = getDb();
  return db
    .prepare("SELECT source key, COUNT(*) n FROM startups WHERE source IS NOT NULL GROUP BY source ORDER BY n DESC")
    .all() as { key: string; n: number }[];
}
