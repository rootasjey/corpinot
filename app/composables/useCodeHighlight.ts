import { createLowlight, all } from 'lowlight'

// Create lowlight instance
const lowlight = createLowlight(all)

// Default languages to register immediately (small set to keep initial bundle small)
const DEFAULT_LANGUAGES = [
  'javascript',
  'typescript',
  'html',
  'css',
  'bash',
  'json',
  'python',
  'vue',
  'jsx',
] as const

// Language aliases map
const LANGUAGE_ALIASES: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'sh': 'bash',
  'shell': 'bash',
  'vue.js': 'vue',
  'react': 'jsx',
  'react.js': 'jsx',
  'tsx': 'typescript', // Note: lowlight doesn't have separate tsx, uses typescript
}

// Popular languages for the selector (display name -> lowlight key)
export const POPULAR_LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Vue.js', value: 'vue' },
  { label: 'React (JSX)', value: 'jsx' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Python', value: 'python' },
  { label: 'Bash', value: 'bash' },
  { label: 'JSON', value: 'json' },
  { label: 'Java', value: 'java' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'PHP', value: 'php' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'SQL', value: 'sql' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'YAML', value: 'yaml' },
  { label: 'XML', value: 'xml' },
] as const

/**
 * Normalize language name (handle aliases)
 */
export function normalizeLangName(lang: string): string {
  const normalized = lang.toLowerCase().trim()
  return LANGUAGE_ALIASES[normalized] || normalized
}

/**
 * Get the lowlight instance (with all languages pre-registered via createLowlight(all))
 */
export function useLowlight() {
  return lowlight
}

/**
 * Composable for code highlighting utilities
 */
export function useCodeHighlight() {
  return {
    lowlight,
    popularLanguages: POPULAR_LANGUAGES,
    normalizeLangName,
  }
}
