import OpenAI from "openai";
import { env } from "../config/env.js";
import { extractJsonFromMixed, tryParseJson } from "./json-repair.js";

type LLMRole = "system" | "user";

type LLMMessage = {
  role: LLMRole;
  content: string;
};

export type LLMRequestOptions = {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  tier: "cheap" | "premium";
  fallbackAttempt?: boolean;
};

type LLMResponse = {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
};

const clients: Record<string, OpenAI> = {
  openai: new OpenAI({ apiKey: env.OPENAI_API_KEY }),
  gemini: new OpenAI({ apiKey: env.GEMINI_API_KEY, baseURL: env.GEMINI_BASE_URL }),
  openrouter: new OpenAI({ apiKey: env.OPENROUTER_API_KEY, baseURL: env.OPENROUTER_BASE_URL })
};

function getProviderModel(provider: string, tier: "cheap" | "premium"): string {
  switch (provider) {
    case "openai": return env.OPENAI_MODEL;
    case "gemini": return env.GEMINI_MODEL;
    case "openrouter": return env.OPENROUTER_MODEL;
    default: return env.GEMINI_MODEL;
  }
}

const circuitBreaker = {
  failures: new Map<string, number>(),
  lastFailure: new Map<string, number>(),
  THRESHOLD: env.LLM_CIRCUIT_BREAKER_THRESHOLD,
  COOLDOWN_MS: env.LLM_CIRCUIT_BREAKER_COOLDOWN_MS
};

function isProviderAvailable(provider: string): boolean {
  const failures = circuitBreaker.failures.get(provider) || 0;
  if (failures < circuitBreaker.THRESHOLD) return true;

  const lastFailure = circuitBreaker.lastFailure.get(provider) || 0;
  if (Date.now() - lastFailure > circuitBreaker.COOLDOWN_MS) {
    circuitBreaker.failures.set(provider, 0);
    return true;
  }
  return false;
}

function recordFailure(provider: string) {
  const current = circuitBreaker.failures.get(provider) || 0;
  circuitBreaker.failures.set(provider, current + 1);
  circuitBreaker.lastFailure.set(provider, Date.now());
}

export async function callLLM(options: LLMRequestOptions): Promise<LLMResponse> {
  const primaryProvider = options.tier === "cheap" ? env.LLM_CHEAP_PROVIDER : env.LLM_PREMIUM_PROVIDER;
  const secondaryProvider = primaryProvider === "gemini" ? "openai" : "gemini";

  let provider = primaryProvider;
  
  if (!isProviderAvailable(provider) || options.fallbackAttempt) {
    provider = secondaryProvider;
  }

  const model = getProviderModel(provider, options.tier);
  const client = clients[provider];
  const temperature = options.temperature ?? env.LLM_TEMPERATURE;
  const maxTokens = options.maxTokens ?? env.LLM_MAX_TOKENS;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: options.messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty content");

    return {
      content,
      model,
      provider,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0
    };
  } catch (error) {
    recordFailure(provider);
    
    if (provider === primaryProvider && !options.fallbackAttempt) {
      return callLLM({ ...options, fallbackAttempt: true });
    }
    
    throw error;
  }
}

export function parseLLMJson<T>(raw: string): T {
  const extracted = extractJsonFromMixed(raw);
  const result = tryParseJson<T>(extracted);
  if (result.success) return result.data;
  throw new Error(`JSON parse failed: ${result.error}`);
}
