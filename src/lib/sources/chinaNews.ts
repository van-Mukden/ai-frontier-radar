/**
 * 中文融资新闻源（Google News RSS，免费无 key）。
 * 用于发现中国/日本的早期 Agent 创业公司（YC/HN 结构性只有美国，覆盖不到）。
 * 境外服务器（Render / GitHub Actions）稳定；国内本地访问 Google 受限，可用 CHINA_NEWS_RSS 覆盖为其它源。
 */
export interface NewsItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

const QUERIES = ["AI Agent 融资", "AI 智能体 融资", "AI Agent 天使轮 种子轮", "AI Agent 公司 A轮"];

export async function fetchChinaAgentFundingNews(sinceDays = 60): Promise<NewsItem[]> {
  const seen = new Map<string, NewsItem>();
  for (const q of QUERIES) {
    const base =
      process.env.CHINA_NEWS_RSS ??
      `https://news.google.com/rss/search?hl=zh-CN&gl=CN&ceid=CN:zh&q=`;
    const url = `${base}${encodeURIComponent(`${q} when:${sinceDays}d`)}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ai-frontier-radar" } });
      if (!res.ok) continue;
      const xml = await res.text();
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const block = m[1];
        const title = pick(block, "title");
        if (!title || /融资|轮/.test(title) === false) continue; // 只留像融资的
        const key = norm(title);
        if (seen.has(key)) continue;
        seen.set(key, {
          title,
          snippet: pick(block, "description").replace(/<[^>]+>/g, " ").slice(0, 300),
          url: pick(block, "link"),
          source: pick(block, "source") || "news",
        });
      }
    } catch {
      /* 单个查询失败不阻断 */
    }
  }
  return [...seen.values()];
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return (m?.[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}
function norm(s: string): string {
  return s.replace(/\s+/g, "").slice(0, 40);
}
