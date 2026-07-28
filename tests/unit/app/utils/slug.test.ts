import { describe, expect, it } from 'vitest'
import { normalizeSlug, deriveSlugFromName } from '../../../../app/utils/slug'

describe('normalizeSlug', () => {
  it('lowercases the string', () => {
    expect(normalizeSlug('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(normalizeSlug('hello world foo')).toBe('hello-world-foo')
  })

  it('removes special characters', () => {
    expect(normalizeSlug('hello! world@ foo#')).toBe('hello-world-foo')
  })

  it('collapses multiple hyphens', () => {
    expect(normalizeSlug('hello---world')).toBe('hello-world')
  })

  it('replaces leading/trailing whitespace with hyphens', () => {
    expect(normalizeSlug('  hello world  ')).toBe('-hello-world-')
  })

  it('handles empty string', () => {
    expect(normalizeSlug('')).toBe('')
  })

  it('collapses spaces-only input to single hyphen', () => {
    expect(normalizeSlug('!!! @@@ ###')).toBe('-')
  })

  it('preserves numbers', () => {
    expect(normalizeSlug('hello 123 world')).toBe('hello-123-world')
  })
})

describe('deriveSlugFromName', () => {
  it('delegates to normalizeSlug', () => {
    expect(deriveSlugFromName('My Awesome Post')).toBe('my-awesome-post')
  })
})
