import { describe, expect, test } from 'vitest'

import { addMissingLines, mergeDeep, mergeJsonText, mergeYamlText, replaceSection } from './content.ts'

describe('mergeDeep', () => {
  test('merges nested objects and lets the override win', () => {
    expect(mergeDeep({ a: { b: 1, c: 2 }, d: 1 }, { a: { b: 3 }, e: 4 })).toEqual({ a: { b: 3, c: 2 }, d: 1, e: 4 })
  })

  test('replaces arrays instead of merging them', () => {
    expect(mergeDeep({ a: [1, 2] }, { a: [3] })).toEqual({ a: [3] })
  })
})

describe('mergeJsonText', () => {
  test('creates the file when it does not exist', () => {
    expect(mergeJsonText(undefined, '{"a":1}')).toBe('{\n  "a": 1\n}\n')
  })

  test('keeps unrelated keys', () => {
    expect(JSON.parse(mergeJsonText('{"a":1,"b":2}', '{"b":3}'))).toEqual({ a: 1, b: 3 })
  })
})

describe('mergeYamlText', () => {
  test('keeps existing values and adds missing keys', () => {
    const merged = mergeYamlText('allowBuilds:\n  sharp: false\n  extra: true\n', 'allowBuilds:\n  sharp: true\n  esbuild: false\n')

    expect(merged).toContain('sharp: false')
    expect(merged).toContain('esbuild: false')
    expect(merged).toContain('extra: true')
  })

  test('unions lists', () => {
    expect(mergeYamlText('packages:\n  - a\n  - b\n', 'packages:\n  - b\n  - c\n')).toBe('packages:\n  - b\n  - c\n  - a\n')
  })
})

describe('addMissingLines', () => {
  test('returns the template for new files', () => {
    expect(addMissingLines(undefined, 'a\nb\n')).toBe('a\nb\n')
  })

  test('leaves files untouched when nothing is missing', () => {
    expect(addMissingLines('a\nextra\nb\n', 'a\nb\n')).toBe('a\nextra\nb\n')
  })

  test('appends missing patterns and keeps extras', () => {
    expect(addMissingLines('a\nextra\n', 'a\nb\n')).toBe('a\nextra\nb\n')
  })

  test('brings the comment of a missing pattern along', () => {
    expect(addMissingLines('a\n', '# Section\nb\n')).toBe('a\n\n# Section\nb\n')
  })

  test('drops comments whose patterns already exist', () => {
    expect(addMissingLines('b\n', '# Section\nb\n')).toBe('b\n')
  })
})

describe('replaceSection', () => {
  const template = '## License\n\nMIT\n'

  test('returns the template when there is no README', () => {
    expect(replaceSection(undefined, template, 'License')).toBe(template)
  })

  test('replaces only the license section', () => {
    const existing = '# Title\n\nText\n\n## License\n\nOld\n\n## Other\n\nKept\n'

    expect(replaceSection(existing, template, 'License')).toBe('# Title\n\nText\n\n## License\n\nMIT\n\n## Other\n\nKept\n')
  })

  test('appends the section when missing', () => {
    expect(replaceSection('# Title\n', template, 'License')).toBe('# Title\n\n## License\n\nMIT\n')
  })
})
