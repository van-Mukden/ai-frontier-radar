import {
  counts,
  getRepoRows,
  getStartupRows,
  repoDomainCounts,
  startupRegionCounts,
  startupSourceCounts,
} from "@/lib/queries";

/** 给 Copilot 的紧凑数据快照（本工具真实数据，作 grounding，控 token）。 */
export function buildRadarSnapshot(): string {
  const c = counts();
  const repos = getRepoRows({ limit: 8 }).map((r) => ({
    name: r.full_name,
    domain: r.primary_domain,
    lang: r.origin_lang,
    score: Math.round(r.assessment?.final_score ?? 0),
    stars: r.signals?.stars,
    velocity7d: Number(r.signals?.star_velocity_7d?.toFixed(1) ?? 0),
    breakout: !!r.signals?.breakout_flag,
    authenticity: r.authenticity?.label,
    one_liner: r.assessment?.one_liner,
    subscores: r.assessment?.subscores,
  }));
  const startups = getStartupRows({ limit: 12 }).map((s) => ({
    name: s.name,
    region: s.region,
    subcategory: s.agent_subcategory,
    source: s.source,
    batch: s.batch,
    score: Math.round(s.assessment?.final_score ?? 0),
    momentum: s.assessment?.momentum_score,
    tech_stack: s.tech_stack,
    thesis: s.assessment?.thesis?.slice(0, 120),
    latestRound: s.rounds[s.rounds.length - 1]
      ? {
          stage: s.rounds[s.rounds.length - 1].stage,
          amount_usd: s.rounds[s.rounds.length - 1].amount_usd,
          lead: s.rounds[s.rounds.length - 1].lead_investors,
        }
      : null,
  }));

  const snapshot = {
    updated: new Date().toISOString().slice(0, 10),
    counts: c,
    distributions: {
      repo_domains: repoDomainCounts(),
      startup_regions: startupRegionCounts(),
      startup_sources: startupSourceCounts(),
    },
    top_repos: repos,
    top_startups: startups,
  };
  return JSON.stringify(snapshot);
}
