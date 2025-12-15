import {
  generateText as aiGenerateText,
  generateObject as aiGenerateObject,
  type ModelMessage,
} from 'ai'
import { z } from 'zod'
import type {
  LlmUsage,
  LlmResult,
  GenerateTextOptions,
  GenerateObjectOptions,
} from './@types/index.js'
import { hashPrompt } from './hash.js'

export async function generateText(options: GenerateTextOptions): Promise<LlmResult<string>> {
  const startTime = Date.now()
  const promptHash = hashPrompt(options.system, options.prompt)

  const result = await aiGenerateText({
    model: options.model,
    system: options.system,
    messages: buildMessages(options.prompt, options.imageBase64),
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

/**
 * Generate a structured object from an LLM using a Zod schema.
 * Compatible with both Zod 3 and Zod 4 schemas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateObject<TSchema = any, TOutput = any>(
  options: GenerateObjectOptions<TSchema, TOutput>,
): Promise<LlmResult<TOutput>> {
  const startTime = Date.now()
  const promptHash = hashPrompt(options.system, options.prompt)

  const result = await aiGenerateObject({
    model: options.model,
    system: options.system,
    messages: buildMessages(options.prompt, options.imageBase64),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: options.schema as any,
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

  return { content: result.object as TOutput, usage }
}

function buildMessages(prompt: string, imageBase64?: string): ModelMessage[] {
  if (!imageBase64) {
    return [{ role: 'user', content: prompt }]
  }

  return [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image', image: imageBase64 },
      ],
    },
  ]
}
