import { M1_INGEST } from "@/config/scoring";

const GH = "https://api.github.com";

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-frontier-radar",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export interface GHRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  topics: string[];
  created_at: string;
  pushed_at: string;
  owner: { login: string };
}

/** 搜索近 N 天创建、star≥下限的 AI 相关新仓库（PRD §6.2 主力源）。 */
export async function searchNewAIRepos(limit = M1_INGEST.perPage): Promise<GHRepo[]> {
  const since = new Date(Date.now() - M1_INGEST.createdWithinDays * 864e5)
    .toISOString()
    .slice(0, 10);
  const orExpr = `(${M1_INGEST.keywords.map((k) => (k.includes(" ") ? `"${k}"` : k)).join(" OR ")})`;
  const q = `${orExpr} created:>${since} stars:${M1_INGEST.minStars}..${M1_INGEST.maxStars}`;
  const url = `${GH}/search/repositories?q=${encodeURIComponent(
    q
  )}&sort=stars&order=desc&per_page=${Math.min(limit, 100)}`;
  const res = await fetch(url, { headers: { ...headers(), Accept: "application/vnd.github.mercy-preview+json" } });
  if (!res.ok) throw new Error(`github search ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.items ?? []).map((r: GHRepo & { topics?: string[] }) => ({
    ...r,
    topics: r.topics ?? [],
  }));
}

/** 拉单个仓库的元数据（Copilot 评估用）。 */
export async function getRepoMeta(full_name: string): Promise<GHRepo | null> {
  const res = await fetch(`${GH}/repos/${full_name}`, {
    headers: { ...headers(), Accept: "application/vnd.github.mercy-preview+json" },
  });
  if (!res.ok) return null;
  const r = (await res.json()) as GHRepo & { topics?: string[] };
  return { ...r, topics: r.topics ?? [] };
}

export async function getReadme(full_name: string): Promise<string> {
  const res = await fetch(`${GH}/repos/${full_name}/readme`, {
    headers: { ...headers(), Accept: "application/vnd.github.raw+json" },
  });
  if (!res.ok) return "";
  return (await res.text()).slice(0, 8000);
}

/** 贡献者数量（读 Link header 末页），用于 team / bus factor 信号。 */
export async function getContributorsCount(full_name: string): Promise<number> {
  const res = await fetch(`${GH}/repos/${full_name}/contributors?per_page=1&anon=true`, {
    headers: headers(),
  });
  if (!res.ok) return 0;
  const link = res.headers.get("link");
  if (link) {
    const m = link.match(/[?&]page=(\d+)>; rel="last"/);
    if (m) return parseInt(m[1], 10);
  }
  const arr = await res.json();
  return Array.isArray(arr) ? arr.length : 0;
}

/**
 * 用 stargazer 时间戳算真实的 7 日 / 上一个 7 日 star 增量（PRD §6.2 backfill）。
 * 只对小仓库做（成本可控）；大仓库返回 null，改由每日快照累积。
 */
export async function starVelocityFromStargazers(
  full_name: string,
  totalStars: number,
  starCap = 3000
): Promise<{ gained7d: number; gainedPrev7d: number } | null> {
  if (totalStars > starCap) return null;
  const now = Date.now();
  const d7 = now - 7 * 864e5;
  const d14 = now - 14 * 864e5;
  let gained7d = 0;
  let gainedPrev7d = 0;
  const pages = Math.min(Math.ceil(totalStars / 100), 40); // 上限保护
  // 从最后一页往前翻（最新的 star 在后面）
  for (let p = pages; p >= 1; p--) {
    const res = await fetch(
      `${GH}/repos/${full_name}/stargazers?per_page=100&page=${p}`,
      { headers: { ...headers(), Accept: "application/vnd.github.star+json" } }
    );
    if (!res.ok) break;
    const arr: { starred_at: string }[] = await res.json();
    let allOlder = true;
    for (const s of arr) {
      const t = new Date(s.starred_at).getTime();
      if (t >= d7) gained7d++;
      else if (t >= d14) gainedPrev7d++;
      if (t >= d14) allOlder = false;
    }
    // 这一页全部早于 14 天前，再往前翻没意义
    if (allOlder && arr.length > 0) break;
  }
  return { gained7d, gainedPrev7d };
}

export async function rateLimitRemaining(): Promise<number> {
  const res = await fetch(`${GH}/rate_limit`, { headers: headers() });
  if (!res.ok) return 0;
  const data = await res.json();
  return data?.resources?.core?.remaining ?? 0;
}

/** 列出仓库根目录文件（真实性核查用：判断是否有 quickstart、文件规模等）。 */
export async function listRootTree(full_name: string): Promise<string[]> {
  const repoRes = await fetch(`${GH}/repos/${full_name}`, { headers: headers() });
  if (!repoRes.ok) return [];
  const repo = await repoRes.json();
  const branch = repo.default_branch ?? "main";
  const res = await fetch(
    `${GH}/repos/${full_name}/git/trees/${branch}?recursive=1`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.tree ?? []).map((t: { path: string }) => t.path);
}
