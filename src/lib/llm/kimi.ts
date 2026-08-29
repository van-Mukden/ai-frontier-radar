import { z } from "zod";
import type { LLMProvider } from "./provider";

/**
 * 全局节流：串行化 LLM 调用并保证最小间隔，适配低 RPM 账号（如 Moonshot 免费档 3 RPM）。
 * 默认 21s（≈2.8/min，稳压 3 RPM 以下）；账号提额后设 LLM_MIN_INTERVAL_MS=0 关掉。
 */
const MIN_INTERVAL = Number(process.env.LLM_MIN_INTERVAL_MS ?? 21000);
let lastCallAt = 0;
let gate: Promise<void> = Promise.resolve();
async function throttle() {
  // MIN_INTERVAL<=0（高 RPM 账号）：不串行化，允许并发满速
  if (MIN_INTERVAL <= 0) return;
  const prev = gate;
  let release!: () => void;
  gate = new Promise<void>((r) => (release = r));
  await prev;
  const wait = Math.max(0, lastCallAt + MIN_INTERVAL - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
  release();
}

/**
 * 通用 OpenAI 兼容 provider（Kimi / DeepSeek / 通义千问 / GLM 等都兼容）。
 * 优先读通用 env：LLM_API_KEY / LLM_BASE_URL / LLM_MODEL，
 * 回退到 MOONSHOT_* 以兼容旧配置。改模型只改 .env，代码不动（PRD §10 provider 抽象）。
 */
export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.LLM_API_KEY ?? process.env.MOONSHOT_API_KEY ?? "";
    this.model = process.env.LLM_MODEL ?? process.env.MOONSHOT_MODEL ?? "kimi-k2-0711-preview";
    this.baseUrl =
      process.env.LLM_BASE_URL ?? process.env.MOONSHOT_BASE_URL ?? "https://api.moonshot.cn/v1";
    // provider 名取 base_url 的主机名前缀，便于落库标记（如 moonshot / deepseek / dashscope）
    this.name = (this.baseUrl.match(/https?:\/\/(?:api\.)?([a-z0-9-]+)/i)?.[1] ?? "llm").toLowerCase();
  }

  private async request(
    messages: { role: string; content: string }[],
    opts: { json: boolean; maxTokens?: number }
  ): Promise<string> {
    const maxRetries = 6;
    for (let attempt = 0; ; attempt++) {
      await throttle();
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          temperature: Number(process.env.LLM_TEMPERATURE ?? 1),
          max_tokens: opts.maxTokens ?? Number(process.env.LLM_MAX_TOKENS ?? 8000),
          ...(opts.json ? { response_format: { type: "json_object" } } : {}),
          messages,
        }),
      });

      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.min(1500 * 2 ** attempt, 20000);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      if (!res.ok) throw new Error(`LLM API ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }
  }

  async completeJSON<T>(args: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    maxTokens?: number;
  }): Promise<T> {
    const content = await this.request(
      [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      { json: true, maxTokens: args.maxTokens }
    );
    return args.schema.parse(JSON.parse(extractJson(content || "{}")));
  }

  async chat(args: { messages: { role: string; content: string }[]; maxTokens?: number }): Promise<string> {
    return this.request(args.messages, { json: false, maxTokens: args.maxTokens });
  }
}

// 兼容旧引用名
export { OpenAICompatibleProvider as KimiProvider };

/** 从模型输出里稳健提取 JSON：剥掉 ```json 代码块 / 前后废话，取最外层 {…}。 */
function extractJson(s: string): string {
  let t = s.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return t;
}
