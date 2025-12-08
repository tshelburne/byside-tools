import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOllama } from 'ai-sdk-ollama'
import type { Provider } from './@types/index.js'

export interface ModelConfig {
  provider: Provider
  model: string
  apiKey?: string
  baseUrl?: string
}

const providers = {
  openai: (config: ModelConfig) => {
    const openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
    return openai(config.model)
  },
  anthropic: (config: ModelConfig) => {
    const anthropic = createAnthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
    return anthropic(config.model)
  },
  ollama: (config: ModelConfig) => {
    const ollama = createOllama({
      baseURL: config.baseUrl,
    })
    return ollama(config.model)
  },
}

/**
 * Create a language model from a provider and model name.
 */
export function createModel(config: ModelConfig): LanguageModel {
  const factory = providers[config.provider]
  return factory(config) as LanguageModel
}

/**
 * Create an OpenAI model.
 */
export function openai(model: string, apiKey?: string): LanguageModel {
  return createModel({ provider: 'openai', model, apiKey })
}

/**
 * Create an Anthropic model.
 */
export function anthropic(model: string, apiKey?: string): LanguageModel {
  return createModel({ provider: 'anthropic', model, apiKey })
}

/**
 * Create an Ollama model.
 */
export function ollama(model: string, baseUrl?: string): LanguageModel {
  return createModel({ provider: 'ollama', model, baseUrl })
}
