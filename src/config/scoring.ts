/**
 * 集中评分配置 —— 权重 / 阈值 / 枚举 / 声誉表。
 * 改这里不用改业务代码（对应 PRD §9 末条）。
 */

// ---- M1: 技术领域枚举 ----
export const TECH_DOMAINS = [
  "Agent 框架",
  "Agent 应用·产品",
  "推理·部署 infra",
  "训练·微调·RL",
  "数据·合成数据·pipeline",
  "RAG·检索·记忆",
  "评测·benchmark·可观测",
  "模型权重发布",
  "编码·开发工具",
  "多模态",
  "机器人·具身",
  "其他",
] as const;
export type TechDomain = (typeof TECH_DOMAINS)[number];

export const ORIGIN_LANGS = ["中文", "英文", "其他"] as const;
export type OriginLang = (typeof ORIGIN_LANGS)[number];

// ---- M2: agent 子类 & 地域 ----
export const AGENT_SUBCATEGORIES = [
  "通用 agent",
  "编码 agent",
  "浏览器 agent",
  "RPA 替代",
  "agent infra",
  "agent 评测",
  "agent 记忆",
  "多 agent 编排",
  "其他",
] as const;
export type AgentSubcategory = (typeof AGENT_SUBCATEGORIES)[number];

// 地域限中国 / 美国 / 日本（PRD §7.1）
export const ALLOWED_REGIONS = ["中国", "美国", "日本"] as const;
export type Region = (typeof ALLOWED_REGIONS)[number];

// 技术栈维度（Kimi 从固定枚举抽取，用于关系图谱的技术连线）
export const TECH_STACKS = [
  "自研基础模型",
  "开源模型上层",
  "闭源API封装",
  "RAG·检索栈",
  "浏览器·计算机自动化",
  "多Agent编排",
  "强化学习·后训练",
  "语音·多模态栈",
  "代码执行沙箱",
  "向量库·记忆",
] as const;
export type TechStack = (typeof TECH_STACKS)[number];

// 关系图谱配置
export const GRAPH = { topN: 18 };

// 每周发现：每次采集拉取的候选上限。只做早期发现（YC 近期批次 + HN 发布），
// 默认不含手写旗舰种子——那些是已知大厂，与"早期雷达"定位相悖（RADAR_INCLUDE_SEED=1 可开）。
export const DISCOVER = { ycLimit: 24, hnLimit: 8 };

// region 配色（图谱节点用）：中国红 / 美国蓝 / 日本白
export const REGION_COLORS: Record<string, string> = {
  中国: "#e5484d",
  美国: "#4a90e2",
  日本: "#f0f0f0",
};

// ---- 真实性核查标签（PRD §6.5 L2）----
export const AUTHENTICITY_LABELS = ["跑通", "跑不通", "可疑·充数", "未测"] as const;
export type AuthenticityLabel = (typeof AUTHENTICITY_LABELS)[number];

// ---- M1 排名权重（PRD §6.6）----
export const M1_WEIGHTS = {
  potential: 0.5,
  momentum: 0.35,
  corroboration: 0.15,
};

// 充数命中对 potential_score 的惩罚
export const SUSPICIOUS_PENALTY = 35;

// ---- 爆发标记阈值（PRD §6.3）----
// 两条触发（任一命中即爆发）：① 相对增长快 且 绝对增量够；② 绝对速度快（不看相对）
export const BREAKOUT = {
  minGrowthRate: 0.2, // 一周涨 ≥20%（相对）
  minAbsoluteGain7d: 20, // 且 7 日 ≥20 星
  minVelocityPerDay: 8, // 或 7 日实测速度 ≥8 星/天（真实 GitHub 有时间戳时）
  minAvgVelPerDay: 40, // 或 自创建以来日均 ≥40 星/天（年轻又高星 = 爆发；合成数据也可算）
};

// 跨源印证：算作有效提及的分数门槛（PRD §6.3 信号4）
export const CORROBORATION_THRESHOLDS = {
  hackernews: 50, // HN points
  reddit: 100, // reddit score
  producthunt: 1, // 上榜即算
  github_trending: 1,
};

// ---- 知名机构关键词（贡献者/创始人可信度启发式）----
export const NOTABLE_ORGS = [
  "openai",
  "anthropic",
  "deepmind",
  "google brain",
  "meta ai",
  "fair",
  "mistral",
  "scale ai",
  "stripe",
  "stanford",
  "berkeley",
  "mit",
  "cmu",
  "tsinghua",
  "清华",
  "北大",
  "moonshot",
  "月之暗面",
  "deepseek",
];

// ---- 投资方声誉分层（M2 融资信号加权，PRD §7.4）----
export const INVESTOR_TIERS: Record<string, number> = {
  // tier 1 = 1.0
  "a16z": 1.0,
  "andreessen horowitz": 1.0,
  sequoia: 1.0,
  "sequoia capital": 1.0,
  benchmark: 1.0,
  "founders fund": 1.0,
  greylock: 0.9,
  lightspeed: 0.9,
  "thrive capital": 0.9,
  conviction: 0.9,
  index: 0.85,
  "index ventures": 0.85,
  accel: 0.85,
  khosla: 0.8,
  "y combinator": 0.8,
  "hongshan": 0.9, // 红杉中国
  "sinovation": 0.75,
  "source code capital": 0.75,
};

// ---- M1 候选池筛选（拉新仓库时）----
export const M1_INGEST = {
  // GitHub search: 近 N 天创建、star 落在早期/上升带的 AI 仓库
  // maxStars 压到 2500：① 贴合"爆发前"定位；② 让 stargazer 时间戳能算出真实涨速（在 velocity starCap 内）
  createdWithinDays: 180,
  minStars: 30,
  maxStars: 2500,
  // 自由文本 OR（GitHub 的多个 topic: 是 AND，不能用来做 OR）
  keywords: ["llm", "agent", "rag", "ai agent", "llm agent", "llmops"],
  perPage: 50,
  // 搜索排序：在低 star 带内按 star 取"值得看"的候选，再由我们自算的 velocity 判断爆发
  sort: "stars" as "updated" | "stars",
};
