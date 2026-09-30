import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { parseConfig } from './config.ts'
import { getRepositoryProps, renderTemplate } from './props.ts'
import { getOperations } from './presets.ts'

const templatesPath = resolve(import.meta.dirname, '../templates')
const repositories = parseConfig(JSON.parse(readFileSync(resolve(import.meta.dirname, '../repositories.json'), 'utf8')))

describe('getRepositoryProps', () => {
  test('derives the defaults from the repository name', () => {
    expect(getRepositoryProps({ branch: 'main', ci: false, name: 'owner/repo', preset: 'site' })).toMatchObject({
      homepage: 'https://repo.netlify.app/',
      owner: 'owner',
      packageDirectory: 'repo',
      packageName: 'repo',
      repositoryName: 'repo',
      repositoryUrl: 'https://github.com/owner/repo',
    })
  })

  test('strips the scope from the package directory', () => {
    const props = getRepositoryProps({ branch: 'main', ci: false, name: 'owner/repo', package: '@owner/repo', preset: 'plugin' })

    expect(props.packageName).toBe('@owner/repo')
    expect(props.packageDirectory).toBe('repo')
  })
})

describe('renderTemplate', () => {
  test('replaces every placeholder', () => {
    expect(renderTemplate('<%= a %>-<%=b%>-<%= a %>', { a: '1', b: '2' })).toBe('1-2-1')
  })

  test('throws for unknown placeholders', () => {
    expect(() => renderTemplate('<%= missing %>', {})).toThrow(/missing/)
  })
})

describe('getOperations', () => {
  test.each(repositories.map(({ name }) => name))('%s only references existing, fully resolvable templates', (name) => {
    const repository = repositories.find((candidate) => candidate.name === name)!

    for (const operation of getOperations(repository)) {
      if (operation.type === 'delete') {
        continue
      }

      const path = resolve(templatesPath, operation.source)

      expect(existsSync(path), operation.source).toBe(true)
      expect(() => renderTemplate(readFileSync(path, 'utf8'), operation.props), operation.source).not.toThrow()
    }
  })

  test('only adds CI files when requested', () => {
    const base = { branch: 'main', name: 'owner/repo', preset: 'site' } as const
    const targets = (ci: boolean) => getOperations({ ...base, ci }).map(({ target }) => target)

    expect(targets(false)).not.toContain('.github/workflows/ci.yaml')
    expect(targets(true)).toContain('.github/workflows/ci.yaml')
  })

  test('places plugin files in the package directory', () => {
    const targets = getOperations({ branch: 'main', ci: false, name: 'owner/repo', package: '@owner/repo', preset: 'plugin' }).map(
      ({ target }) => target,
    )

    expect(targets).toContain('packages/repo/package.json')
    expect(targets).toContain('packages/repo/README.md')
  })
})
