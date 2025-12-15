import type { LanguageModel } from 'ai'
import { z } from 'zod'

export const ProviderSchema = z.enum(['anthropic', 'openai', 'ollama'])
export type Provider = z.infer<typeof ProviderSchema>

export interface LlmUsage {
  inputTokens: number
  outputTokens: number
  latencyMs: number
  promptHash: string
  model: string
}

export interface LlmResult<T> {
  content: T
  usage: LlmUsage
}

export interface GenerateTextOptions {
  model: LanguageModel
  system: string
  prompt: string
  imageBase64?: string
  temperature?: number
  maxTokens?: number
}

/**
 * Options for generating structured objects from LLM.
 * The schema parameter accepts any Zod schema (compatible with both Zod 3 and Zod 4).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GenerateObjectOptions<TSchema = any, TOutput = any> {
  model: LanguageModel
  system: string
  prompt: string
  /** Zod schema for structured output. Works with both Zod 3 and Zod 4. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: TSchema
  imageBase64?: string
  temperature?: number
  maxTokens?: number
}
