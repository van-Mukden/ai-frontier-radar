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

export const RepoAssessmentSchema = z.object({
  potential_score: z.number().min(0).max(100),
  subscores: z.object({
    novelty: z.number().min(0).max(100),
    momentum: z.number().min(0).max(100),
    adoption: z.number().min(0).max(100),
    team: z.number().min(0).max(100),
    defensibility: z.number().min(0).max(100),
  }),
  one_liner: z.string(),
  thesis: z.string(),
  risks: z.array(z.string()).max(4),
  comparable_to: z.string(),
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

export const StartupAssessmentSchema = z.object({
  potential_score: z.number().min(0).max(100),
  agent_subcategory: z.enum(AGENT_SUBCATEGORIES),
  tech_stack: z.array(z.enum(TECH_STACKS)).max(3),
  subscores: z.object({
    team: z.number().min(0).max(100),
    funding_signal: z.number().min(0).max(100),
    traction: z.number().min(0).max(100),
    market_timing: z.number().min(0).max(100),
    moat_vs_big_labs: z.number().min(0).max(100),
  }),
  fourc: z.object({
    company: z.string(),
    customers: z.string(),
    competitors: z.string(),
    collaborators: z.string(),
  }),
  thesis: z.string(),
  risks: z.array(z.string()).max(4),
});
export type StartupAssessmentOut = z.infer<typeof StartupAssessmentSchema>;
