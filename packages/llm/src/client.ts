import {
  generateText as aiGenerateText,
  generateObject as aiGenerateObject,
} from 'ai'
import { z } from 'zod'
import type {
  LlmUsage,
  LlmResult,
  GenerateTextOptions,
  GenerateObjectOptions,
} from './@types/index.js'
import { hashPrompt } from './hash.js'

export async function generateText(
  options: GenerateTextOptions,
): Promise<LlmResult<string>> {
  const startTime = Date.now()
  const promptHash = hashPrompt(options.system, options.prompt)

  const result = await aiGenerateText({
    model: options.model,
    system: options.system,
    prompt: options.prompt,
    temperature: options.temperature,
    maxOutputTokens: options.maxTokens,
  })

  const usage: LlmUsage = {
    inputTokens: result.usage.inputTokens ?? 0,
    outputTokens: result.usage.outputTokens ?? 0,
    latencyMs: Date.now() - startTime,
    promptHash,
    model: result.response.modelId ?? 'unknown',
  }

  return { content: result.text, usage }
}

export async function generateObject<T extends z.ZodType>(
  options: GenerateObjectOptions<T>,
): Promise<LlmResult<z.infer<T>>> {
  const startTime = Date.now()
  const promptHash = hashPrompt(options.system, options.prompt)

  const result = await aiGenerateObject({
    model: options.model,
    system: options.system,
    prompt: options.prompt,
    schema: options.schema,
    temperature: options.temperature,
    maxOutputTokens: options.maxTokens,
  })

  const usage: LlmUsage = {
    inputTokens: result.usage.inputTokens ?? 0,
    outputTokens: result.usage.outputTokens ?? 0,
    latencyMs: Date.now() - startTime,
    promptHash,
    model: result.response.modelId ?? 'unknown',
  }

  return { content: result.object as z.infer<T>, usage }
}
