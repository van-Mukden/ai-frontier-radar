/**
 * YC 公司库（yc-oss/api，社区维护、每周自动更新的 YC 全量 JSON）。
 * 结构化数据 → 公司识别不需要 LLM。按 AI 相关标签拉取，过滤地域 + Agent 方向。
 */

const TAG_URLS = [
  "https://yc-oss.github.io/api/tags/artificial-intelligence.json",
  "https://yc-oss.github.io/api/tags/generative-ai.json",
  "https://yc-oss.github.io/api/tags/ai-assistant.json",
];

interface YCRaw {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  all_locations: string | null;
  one_liner: string | null;
  long_description: string | null;
  batch: string | null;
  tags: string[] | null;
  status: string | null;
}

export interface YCCandidate {
  name: string;
  url: string;
  batch: string;
  region: "中国" | "美国" | "日本";
  description: string;
  source: "yc";
}

function regionOf(loc: string | null): "中国" | "美国" | "日本" | null {
  const s = (loc ?? "").toLowerCase();
  if (/(japan|tokyo|osaka|kyoto)/.test(s)) return "日本";
  if (/(china|beijing|shanghai|shenzhen|hangzhou|guangzhou|chengdu|中国)/.test(s)) return "中国";
  if (/(usa|united states|, ca|, ny|, tx|, wa|san francisco|new york|palo alto|mountain view|seattle|austin|boston)/.test(s))
    return "美国";
  return null;
}

const AGENT_KEYWORDS = [
  "agent",
  "agents",
  "autonomous",
  "copilot",
  "co-pilot",
  "assistant",
  "rpa",
  "workflow automation",
  "automate",
  "ai employee",
  "ai worker",
  "browser automation",
  "multi-agent",
  "orchestrat",
];

function isAgentDirection(c: YCRaw): boolean {
  const hay = `${c.name} ${c.one_liner ?? ""} ${c.long_description ?? ""} ${(c.tags ?? []).join(" ")}`.toLowerCase();
  return AGENT_KEYWORDS.some((k) => hay.includes(k));
}

function recentBatch(batch: string | null): boolean {
  return /\b(2024|2025|2026)\b/.test(batch ?? "");
}

export async function fetchYCAgentStartups(limit = 25): Promise<YCCandidate[]> {
  const seen = new Map<number, YCRaw>();
  for (const url of TAG_URLS) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "ai-frontier-radar" } });
      if (!res.ok) continue;
      const arr: YCRaw[] = await res.json();
      for (const c of arr) if (!seen.has(c.id)) seen.set(c.id, c);
    } catch {
      /* 单个标签失败不阻断 */
    }
  }

  const out: YCCandidate[] = [];
  for (const c of seen.values()) {
    if (!recentBatch(c.batch)) continue;
    if ((c.status ?? "").toLowerCase() === "dead") continue;
    const region = regionOf(c.all_locations);
    if (!region) continue; // 只要中/美/日
    if (!isAgentDirection(c)) continue;
    if (!c.website) continue;
    out.push({
      name: c.name,
      url: c.website,
      batch: c.batch ?? "",
      region,
      description: (c.one_liner ?? c.long_description ?? "").slice(0, 300),
      source: "yc",
    });
  }

  // 新批次优先
  out.sort((a, b) => batchScore(b.batch) - batchScore(a.batch));
  return out.slice(0, limit);
}

// 粗排：年份*10 + 季节序，让最新批次靠前
function batchScore(batch: string): number {
  const year = Number(batch.match(/(20\d\d)/)?.[1] ?? 0);
  const season = /spring/i.test(batch)
    ? 4
    : /winter/i.test(batch)
    ? 1
    : /summer/i.test(batch)
    ? 3
    : /fall/i.test(batch)
    ? 5
    : 2;
  return year * 10 + season;
}
