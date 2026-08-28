import { CORROBORATION_THRESHOLDS } from "@/config/scoring";

/** HN Algolia API —— 免费无鉴权，信号极强（PRD §6.2）。 */
const ALGOLIA = "https://hn.algolia.com/api/v1";

export interface HNHit {
  objectID: string;
  title: string;
  url: string | null;
  points: number;
  num_comments: number;
  created_at: string;
  story_text?: string | null;
}

/** 搜索最近关于某仓库/关键词的高分故事。 */
export async function searchHN(query: string, sinceDays = 30): Promise<HNHit[]> {
  const since = Math.floor((Date.now() - sinceDays * 864e5) / 1000);
  const url = `${ALGOLIA}/search?query=${encodeURIComponent(
    query
  )}&tags=story&numericFilters=created_at_i>${since},points>=${CORROBORATION_THRESHOLDS.hackernews}&hitsPerPage=10`;
  const res = await fetch(url, { headers: { "User-Agent": "ai-frontier-radar" } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.hits ?? [];
}

/** 拉最近 AI/agent 相关的 Show HN / Launch HN，作为 M2 早期公司信号来源。 */
export async function frontpageAIStories(sinceDays = 30): Promise<HNHit[]> {
  const since = Math.floor((Date.now() - sinceDays * 864e5) / 1000);
  const url = `${ALGOLIA}/search?query=AI%20agent&tags=story&numericFilters=created_at_i>${since},points>=40&hitsPerPage=30`;
  const res = await fetch(url, { headers: { "User-Agent": "ai-frontier-radar" } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.hits ?? [];
}

/** Launch HN / Show HN 里的 AI 产品发布帖 —— 作为公司发现候选（需 LLM 抽取公司信息）。 */
export async function launchShowHNCandidates(sinceDays = 120): Promise<HNHit[]> {
  const since = Math.floor((Date.now() - sinceDays * 864e5) / 1000);
  const seen = new Map<string, HNHit>();
  for (const q of ["Launch HN agent", "Show HN AI agent", "Launch HN AI"]) {
    const url = `${ALGOLIA}/search?query=${encodeURIComponent(
      q
    )}&tags=story&numericFilters=created_at_i>${since},points>=20&hitsPerPage=20`;
    const res = await fetch(url, { headers: { "User-Agent": "ai-frontier-radar" } });
    if (!res.ok) continue;
    const data = await res.json();
    for (const h of (data.hits ?? []) as HNHit[]) {
      if (/^(launch hn|show hn)/i.test(h.title)) seen.set(h.objectID, h);
    }
  }
  return [...seen.values()].sort((a, b) => b.points - a.points);
}
