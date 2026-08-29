import { z } from "zod";
import { TECH_DOMAINS, ORIGIN_LANGS, AGENT_SUBCATEGORIES, TECH_STACKS } from "@/config/scoring";

export const PROMPT_VERSION = "2026-08-28.v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 统一的 LLM provider 接口，业务代码只依赖这个（PRD §10）。 */
export interface LLMProvider {
  readonly name: string;
  /** 单次结构化补全：给 system+user，拿回符合 schema 的 JSON。 */
  completeJSON<T>(args: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    maxTokens?: number;
  }): Promise<T>;
  /** 自由文本对话补全（Copilot 用）。 */
  chat(args: { messages: ChatMessage[]; maxTokens?: number }): Promise<string>;
}

// ---------- 结构化输出 schema ----------

export const RepoClassificationSchema = z.object({
  origin_lang: z.enum(ORIGIN_LANGS),
  primary_domain: z.enum(TECH_DOMAINS),
  secondary_domains: z.array(z.enum(TECH_DOMAINS)).max(3),
});
export type RepoClassification = z.infer<typeof RepoClassificationSchema>;

const score = z.coerce.number().catch(0).pipe(z.number().min(0).max(100));
export const RepoAssessmentSchema = z.object({
  potential_score: score,
  subscores: z.object({
    novelty: score,
    momentum: score,
    adoption: score,
    team: score,
    defensibility: score,
  }),
  one_liner: z.string().catch(""),
  thesis: z.string().catch(""),
  risks: z.array(z.string()).max(4).catch([]),
  comparable_to: z.string().catch(""),
});
export type RepoAssessmentOut = z.infer<typeof RepoAssessmentSchema>;

export const AuthenticitySchema = z.object({
  label: z.enum(["跑通", "跑不通", "可疑·充数", "未测"]),
  evidence: z.array(z.string()).max(6),
  flags: z.array(z.string()).max(6),
});
export type AuthenticityOut = z.infer<typeof AuthenticitySchema>;

export const HNExtractSchema = z.object({
  is_agent_startup: z.boolean(),
  name: z.string(),
  url: z.string(),
  region: z.enum(["中国", "美国", "日本", "其他"]),
  agent_subcategory: z.enum(AGENT_SUBCATEGORIES),
  description: z.string(),
});
export type HNExtractOut = z.infer<typeof HNExtractSchema>;

// 容错布尔：模型偶尔返回 "true"/"是"/1，或字段缺失；一律安全归一，避免整条丢弃
const looseBool = z
  .union([z.boolean(), z.string(), z.number()])
  .transform((v) => v === true || v === 1 || v === "true" || v === "是" || v === "yes")
  .catch(false);

export const NewsExtractSchema = z.object({
  is_agent_startup: looseBool,
  name: z.string().catch(""),
  region: z.enum(["中国", "美国", "日本", "其他"]).catch("其他"),
  agent_subcategory: z.enum(AGENT_SUBCATEGORIES).catch("其他"),
  description: z.string().catch(""),
  stage: z.string().catch(""),
  amount_usd_million: z.coerce.number().catch(0),
  lead_investors: z.array(z.string()).max(5).catch([]),
});
export type NewsExtractOut = z.infer<typeof NewsExtractSchema>;

export const StartupAssessmentSchema = z.object({
  potential_score: score,
  agent_subcategory: z.enum(AGENT_SUBCATEGORIES).catch("其他"),
  tech_stack: z.array(z.enum(TECH_STACKS)).max(3).catch([]),
  subscores: z.object({
    team: score,
    funding_signal: score,
    traction: score,
    market_timing: score,
    moat_vs_big_labs: score,
  }),
  fourc: z.object({
    company: z.string().catch(""),
    customers: z.string().catch(""),
    competitors: z.string().catch(""),
    collaborators: z.string().catch(""),
  }),
  thesis: z.string().catch(""),
  risks: z.array(z.string()).max(4).catch([]),
});
export type StartupAssessmentOut = z.infer<typeof StartupAssessmentSchema>;
