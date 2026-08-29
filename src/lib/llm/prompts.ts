import { TECH_DOMAINS, AGENT_SUBCATEGORIES, TECH_STACKS } from "@/config/scoring";

/** 每个 prompt 以 <<TASK:xxx>> 开头，供 mock provider 路由；Kimi 侧视作普通文本。 */

export function repoClassifyPrompt(input: {
  full_name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  readmeExcerpt: string;
}) {
  const system =
    `<<TASK:repo_classify>>你是 AI 开源项目分类器。只输出 JSON。` +
    `技术领域必须从这个固定枚举里选：${TECH_DOMAINS.join(" / ")}。` +
    `origin_lang 从 {中文, 英文, 其他} 里选，依据 README 语言与维护者背景。`;
  const user = `仓库：${input.full_name}
语言：${input.language ?? "?"}
topics：${input.topics.join(", ")}
描述：${input.description ?? ""}
README 摘录：
${input.readmeExcerpt.slice(0, 4000)}

输出 JSON：{"origin_lang","primary_domain","secondary_domains":[]}`;
  return { system, user };
}

export function repoAssessPrompt(input: {
  full_name: string;
  description: string | null;
  primary_domain: string;
  signals: {
    stars: number;
    star_velocity_7d: number;
    growth_rate: number;
    corroboration_count: number;
    breakout_flag: number;
  };
  contributorsNote: string;
  topMentions: string[];
  readmeExcerpt: string;
  suspicious: boolean;
}) {
  const system =
    `<<TASK:repo_assess>>你是资深 AI 投资/技术研究员，评估一个开源项目「成为下一个爆款」的潜力。` +
    `只输出 JSON。评分基于：novelty(想法新不新)、momentum(信号是否加速)、adoption(有无真实使用证据)、` +
    `team(维护者可信度)、defensibility(为何不会被一个周末复刻)。` +
    `绝对 star 是滞后指标，重点看增长速度与跨源印证。thesis 用中文，2-3 句。`;
  const user = `仓库：${input.full_name}（领域：${input.primary_domain}）
描述：${input.description ?? ""}
确定性信号：stars=${input.signals.stars}, 7日速度=${input.signals.star_velocity_7d.toFixed(
    1
  )}/天, 相对增长=${(input.signals.growth_rate * 100).toFixed(0)}%, 跨源印证=${
    input.signals.corroboration_count
  }个平台, 爆发标记=${input.signals.breakout_flag ? "是" : "否"}
贡献者：${input.contributorsNote}
热门讨论：${input.topMentions.slice(0, 5).join(" | ") || "暂无"}
${input.suspicious ? "注意：静态核查已标记该仓库为 suspicious（疑似充数），请在评分中反映。" : ""}
README 摘录：
${input.readmeExcerpt.slice(0, 4000)}

输出 JSON：{"potential_score","subscores":{"novelty","momentum","adoption","team","defensibility"},"one_liner","thesis","risks":[],"comparable_to"}`;
  return { system, user };
}

export function startupAssessPrompt(input: {
  name: string;
  description: string | null;
  region: string | null;
  batch: string | null;
  fundingNote: string;
  tractionNote: string;
  newsExcerpt: string;
}) {
  const system =
    `<<TASK:startup_assess>>你是 AI 赛道的早期投资分析师，只看 Agent 方向、地域限中国/美国/日本。` +
    `只输出 JSON。给出研报式 4C（Company/Customers/Competitors/Collaborators），每段 1-3 句中文。` +
    `评分维度：team、funding_signal、traction、market_timing、moat_vs_big_labs。` +
    `【重要】potential_score 与所有 subscores 一律用 0-100 的整数打分（0-100 scale，不是 0-10）；` +
    `信息很少时按同类公司的合理先验给分，不要因为材料短就压到接近 0。` +
    `agent_subcategory 从固定枚举选：${AGENT_SUBCATEGORIES.join(" / ")}。` +
    `tech_stack 从固定枚举里选 1-3 个技术栈标签（判断这家公司底层技术路线）：${TECH_STACKS.join(" / ")}。`;
  const user = `公司：${input.name}
地域：${input.region ?? "?"}  批次：${input.batch ?? "?"}
描述：${input.description ?? ""}
融资：${input.fundingNote}
牵引力：${input.tractionNote}
新闻/材料摘录：
${input.newsExcerpt.slice(0, 3500)}

输出 JSON：{"potential_score","agent_subcategory","tech_stack":[],"subscores":{"team","funding_signal","traction","market_timing","moat_vs_big_labs"},"fourc":{"company","customers","competitors","collaborators"},"thesis","risks":[]}`;
  return { system, user };
}

export function hnExtractPrompt(input: { title: string; url: string; text: string }) {
  const system =
    `<<TASK:hn_extract>>你从一条 Hacker News 发布帖里抽取"这是不是一家 Agent 方向的创业公司"。只输出 JSON。` +
    `is_agent_startup=false 时其它字段可留空串/占位。region 从 {中国,美国,日本,其他} 选（判断不了填其他）。` +
    `agent_subcategory 从固定枚举选：${AGENT_SUBCATEGORIES.join(" / ")}。name 用干净的公司名（去掉 "Launch HN:" 等前缀和 "(YC ..)" 后缀）。`;
  const user = `标题：${input.title}
链接：${input.url}
正文：${input.text.slice(0, 1500)}

输出 JSON：{"is_agent_startup","name","url","region","agent_subcategory","description"}`;
  return { system, user };
}

export function newsExtractPrompt(input: { title: string; snippet: string }) {
  const system =
    `<<TASK:news_extract>>你从一条中文融资新闻里抽取「这是不是一家 Agent 方向的创业公司融资」。只输出 JSON。` +
    `is_agent_startup=false 时其它可留空。region 从 {中国,美国,日本,其他} 选。` +
    `agent_subcategory 从固定枚举选：${AGENT_SUBCATEGORIES.join(" / ")}。` +
    `name 用干净的公司名（去掉"完成/获/融资"等）。stage 如 天使轮/Pre-A/A轮/B轮。amount_usd_million 换算成百万美元的数字（"数亿元"约取 15，"数千万"约取 5，未知填 0）。lead_investors 填领投方数组。`;
  const user = `标题：${input.title}\n摘要：${input.snippet}\n\n输出 JSON：{"is_agent_startup","name","region","agent_subcategory","description","stage","amount_usd_million","lead_investors":[]}`;
  return { system, user };
}

export function digestPrompt(input: { date: string; items: string }) {
  const system =
    `<<TASK:digest>>你是 AI 情报编辑，把今日榜单写成一段简洁中文早报。每条：名称 + 一句话是什么 + 为什么上榜。`;
  const user = `日期 ${input.date}，今日 Top 榜单：\n${input.items}\n\n写成 markdown 早报。`;
  return { system, user };
}
