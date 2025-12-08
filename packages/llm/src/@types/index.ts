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
  temperature?: number
  maxTokens?: number
}

export interface GenerateObjectOptions<T extends z.ZodType> {
  model: LanguageModel
  system: string
  prompt: string
  schema: T
  temperature?: number
  maxTokens?: number
}
