import { createHash } from 'node:crypto'

export function hashPrompt(systemPrompt: string, userPrompt: string): string {
  const combined = `${systemPrompt}\n---\n${userPrompt}`
  return createHash('sha256').update(combined).digest('hex')
}
