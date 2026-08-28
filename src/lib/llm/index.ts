import type { LLMProvider } from "./provider";
import { OpenAICompatibleProvider } from "./kimi";
import { MockProvider } from "./mock";

let _provider: LLMProvider | null = null;

/**
 * Provider 工厂：配了 LLM_API_KEY（或旧的 MOONSHOT_API_KEY）就走真实模型，否则离线 mock。
 * LLM_PROVIDER=mock 可强制离线；LLM_PROVIDER=api 强制走真实（用于调试）。
 */
export function getLLM(): LLMProvider {
  if (_provider) return _provider;
  const forced = process.env.LLM_PROVIDER;
  const hasKey = !!(process.env.LLM_API_KEY || process.env.MOONSHOT_API_KEY);
  if (forced === "mock") {
    _provider = new MockProvider();
  } else if (forced === "api" || forced === "kimi" || hasKey) {
    _provider = new OpenAICompatibleProvider();
  } else {
    _provider = new MockProvider();
  }
  return _provider;
}

export function providerName(): string {
  return getLLM().name;
}

export * from "./provider";
