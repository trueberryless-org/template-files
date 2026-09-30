import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { findRepository, parseConfig } from './config.ts'

const entry = { name: 'owner/repo', preset: 'site', year: 2026 }

describe('parseConfig', () => {
  test('applies defaults', () => {
    expect(parseConfig({ repositories: [entry] })).toEqual([{ ...entry, branch: 'main', ci: false }])
  })

  test('rejects duplicated repositories', () => {
    expect(() => parseConfig({ repositories: [entry, entry] })).toThrow(/more than once/)
  })

  test('rejects unknown presets', () => {
    expect(() => parseConfig({ repositories: [{ ...entry, preset: 'unknown' }] })).toThrow()
  })

  test('rejects names without an owner', () => {
    expect(() => parseConfig({ repositories: [{ ...entry, name: 'repo' }] })).toThrow()
  })

  test('accepts the committed repositories.json', () => {
    const file = resolve(import.meta.dirname, '../repositories.json')

    expect(parseConfig(JSON.parse(readFileSync(file, 'utf8'))).length).toBeGreaterThan(0)
  })
})

describe('findRepository', () => {
  test('throws for unlisted repositories', () => {
    expect(() => findRepository(parseConfig({ repositories: [entry] }), 'owner/other')).toThrow(/not listed/)
  })
})
