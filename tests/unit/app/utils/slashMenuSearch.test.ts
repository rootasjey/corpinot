import { describe, expect, it } from 'vitest'
import { filterFloatingActions } from '../../../../app/utils/slashMenuSearch'
import type { SearchableAction } from '../../../../app/utils/slashMenuSearch'

describe('filterFloatingActions', () => {
  const actions: SearchableAction[] = [
    { label: 'Heading 1', description: 'Large heading' },
    { label: 'Heading 2', description: 'Medium heading' },
    { label: 'Bold', description: 'Make text bold' },
    { label: 'Italic', description: 'Make text italic' },
    { label: 'Image', description: 'Insert an image' },
  ]

  it('returns all actions when no query', () => {
    expect(filterFloatingActions(actions, '')).toHaveLength(5)
  })

  it('returns all actions for whitespace-only query', () => {
    expect(filterFloatingActions(actions, '  ')).toHaveLength(5)
  })

  it('filters by label match', () => {
    const result = filterFloatingActions(actions, 'heading')
    expect(result).toHaveLength(2)
    expect(result.map(r => r.action.label)).toEqual(['Heading 1', 'Heading 2'])
  })

  it('filters by description match', () => {
    const result = filterFloatingActions(actions, 'image')
    expect(result).toHaveLength(1)
    expect(result[0].action.label).toBe('Image')
  })

  it('is case insensitive', () => {
    expect(filterFloatingActions(actions, 'HEADING')).toHaveLength(2)
    expect(filterFloatingActions(actions, 'heading')).toHaveLength(2)
  })

  it('matches multiple tokens (AND logic)', () => {
    const result = filterFloatingActions(actions, 'make bold')
    expect(result).toHaveLength(1)
    expect(result[0].action.label).toBe('Bold')
  })

  it('returns empty for no match', () => {
    expect(filterFloatingActions(actions, 'xyz')).toHaveLength(0)
  })

  it('returns empty for empty actions array', () => {
    expect(filterFloatingActions([], 'test')).toHaveLength(0)
  })

  it('supports regex query with // syntax', () => {
    const result = filterFloatingActions(actions, '/head(ing)?/i')
    expect(result).toHaveLength(2)
  })

  it('ignores invalid regex and falls back to token matching', () => {
    const result = filterFloatingActions(actions, '/[invalid/i')
    expect(result).toHaveLength(0)
  })

  it('preserves sourceIndex', () => {
    const result = filterFloatingActions(actions, 'italic')
    expect(result[0].sourceIndex).toBe(3)
  })
})
