import { getRepoMeta, getReadme } from "@/lib/sources/github";
import { webSearch } from "@/lib/sources/websearch";

export type CopilotMode = "qa" | "propose_repo" | "propose_startup";

export interface Retrieval {
  mode: CopilotMode;
  /** 注入给模型的检索上下文（可能为空）。 */
  context: string;
  /** 联网是否可用（给前端/提示用）。 */
  webAvailable: boolean;
}

const REPO_RE = /github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git|\/|$)/i;
const EVAL_RE = /评估|评一下|评一评|加入|添加|纳入|加到|收录|add to|评测|入库/i;
const WEB_RE = /最新|最近|新闻|融资|轮|谁是|是什么|背景|团队|官网|近况|拿了|估值|收购/;

/** 轻量路由 + 确定性检索：按用户输入决定要不要联网 / 拉 repo，返回注入上下文。 */
export async function retrieve(userText: string): Promise<Retrieval> {
  const repoMatch = userText.match(REPO_RE);
  const wantsEval = EVAL_RE.test(userText);
  const bingKey = !!(process.env.TAVILY_API_KEY || process.env.BING_SEARCH_KEY);

  // 1) 评估 repo：出现 github 链接（或链接 + 评估意图）
  if (repoMatch) {
    const full = `${repoMatch[1]}/${repoMatch[2]}`;
    const meta = await getRepoMeta(full);
    if (!meta) {
      return { mode: "qa", context: `【提示】未能拉取仓库 ${full}（可能不存在或私有）。`, webAvailable: bingKey };
    }
    const readme = (await getReadme(full)).slice(0, 3000);
    const ctx = `【待评估的开源仓库（GitHub 实时拉取）】
full_name: ${meta.full_name}
url: ${meta.html_url}
描述: ${meta.description ?? ""}
语言: ${meta.language ?? ""}
topics: ${(meta.topics ?? []).join(", ")}
stars: ${meta.stargazers_count} / forks: ${meta.forks_count} / open_issues: ${meta.open_issues_count}
创建时间: ${meta.created_at} / 最近推送: ${meta.pushed_at}
README 摘录:
${readme}`;
    return { mode: "propose_repo", context: ctx, webAvailable: bingKey };
  }

  // 2) 评估公司：有评估意图但无 repo 链接 → 联网查
  if (wantsEval) {
    const web = await webSearch(userText, 6);
    const ctx = web.available
      ? `【联网检索结果（用于评估该公司）】\n${formatWeb(web.results)}`
      : `【提示】联网不可用（${web.note}）。可让用户补充公司官网/融资/团队等信息再评估。`;
    return { mode: "propose_startup", context: ctx, webAvailable: web.available };
  }

  // 3) 普通问答：命中"需要新信息"关键词且联网可用时补一次搜索
  if (bingKey && WEB_RE.test(userText)) {
    const web = await webSearch(userText, 5);
    if (web.available && web.results.length) {
      return { mode: "qa", context: `【联网补充】\n${formatWeb(web.results)}`, webAvailable: true };
    }
  }

  return { mode: "qa", context: "", webAvailable: bingKey };
}

function formatWeb(results: { title: string; url: string; snippet: string }[]): string {
  return results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n");
}
