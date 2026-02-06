export interface SearchableAction {
  label: string
  description?: string
}

export interface FilteredAction<T extends SearchableAction> {
  action: T
  sourceIndex: number
}

const normalizeQuery = (value: string) => value.trim().toLowerCase()

const tryBuildRegex = (query: string) => {
  const match = query.match(/^\/(.+)\/([gimsuy]*)$/)
  if (!match) return null

  const pattern = match[1]
  const flags = match[2] ?? undefined
  if (!pattern) return null

  try {
    return new RegExp(pattern, flags)
  } catch {
    return null
  }
}

export const filterFloatingActions = <T extends SearchableAction>(
  actions: T[],
  query: string
): FilteredAction<T>[] => {
  if (!actions.length) return []

  const trimmed = query.trim()
  if (!trimmed) {
    return actions.map((action, sourceIndex) => ({ action, sourceIndex }))
  }

  const regex = tryBuildRegex(trimmed)
  const tokens = normalizeQuery(trimmed).split(/\s+/).filter(Boolean)

  return actions
    .map((action, sourceIndex) => ({ action, sourceIndex }))
    .filter(({ action }) => {
      const haystack = `${action.label} ${action.description ?? ''}`.toLowerCase()
      if (regex) return regex.test(haystack)
      return tokens.every((token) => haystack.includes(token))
    })
}
