/**
 * 联网搜索（多 provider）：Tavily 优先（tavily.com，注册即得 key，无需 Azure），
 * 其次 Bing Web Search v7。都没配则返回 available:false，Copilot 降级为"无法联网"。
 */
export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchOut {
  available: boolean;
  provider?: string;
  query: string;
  results: WebResult[];
  note?: string;
}

export async function webSearch(query: string, count = 5): Promise<WebSearchOut> {
  if (process.env.TAVILY_API_KEY) return tavily(query, count);
  if (process.env.BING_SEARCH_KEY) return bing(query, count);
  return googleNews(query, count); // 免费无 key 兜底（境外服务器稳定；国内本地受限）
}

/** 免费无 key 兜底：Google News RSS（新闻为主，够 Copilot 联网找公司/近况）。 */
async function googleNews(query: string, count: number): Promise<WebSearchOut> {
  try {
    const url = `https://news.google.com/rss/search?hl=zh-CN&gl=CN&ceid=CN:zh&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ai-frontier-radar" } });
    if (!res.ok) return { available: false, provider: "googlenews", query, results: [], note: `News ${res.status}` };
    const xml = await res.text();
    const results: WebResult[] = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, count).map((m) => {
      const b = m[1];
      const tag = (t: string) =>
        (b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      return { title: tag("title"), url: tag("link"), snippet: tag("description").replace(/<[^>]+>/g, " ").slice(0, 300) };
    });
    return { available: results.length > 0, provider: "googlenews", query, results };
  } catch (e) {
    return { available: false, provider: "googlenews", query, results: [], note: (e as Error).message.slice(0, 100) };
  }
}

// 向后兼容旧调用名
export const bingSearch = webSearch;

async function tavily(query: string, count: number): Promise<WebSearchOut> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: count,
        search_depth: "basic",
      }),
    });
    if (!res.ok) return { available: false, provider: "tavily", query, results: [], note: `Tavily ${res.status}` };
    const data = await res.json();
    const results: WebResult[] = (data.results ?? []).slice(0, count).map(
      (r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      })
    );
    return { available: true, provider: "tavily", query, results };
  } catch (e) {
    return { available: false, provider: "tavily", query, results: [], note: (e as Error).message.slice(0, 100) };
  }
}

async function bing(query: string, count: number): Promise<WebSearchOut> {
  const endpoint = process.env.BING_SEARCH_ENDPOINT ?? "https://api.bing.microsoft.com/v7.0/search";
  try {
    const url = `${endpoint}?q=${encodeURIComponent(query)}&count=${count}&mkt=zh-CN&responseFilter=Webpages`;
    const res = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": process.env.BING_SEARCH_KEY! } });
    if (!res.ok) return { available: false, provider: "bing", query, results: [], note: `Bing ${res.status}` };
    const data = await res.json();
    const results: WebResult[] = (data.webPages?.value ?? []).slice(0, count).map(
      (w: { name: string; url: string; snippet: string }) => ({ title: w.name, url: w.url, snippet: w.snippet })
    );
    return { available: true, provider: "bing", query, results };
  } catch (e) {
    return { available: false, provider: "bing", query, results: [], note: (e as Error).message.slice(0, 100) };
  }
}
