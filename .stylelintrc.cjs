/**
 * Project-level Stylelint config to avoid false positives for
 * Tailwind / UnoCSS at-rules (eg. @apply) and other utility at-rules
 * used by utility-first CSS engines.
 *
 * Many editors (stylelint extension / CSS language server) will otherwise
 * report `Unknown at rule @apply` (css(unknownAtRules)). This file keeps
 * linting useful while allowing these framework-specific at-rules.
 */
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Allow Tailwind / UnoCSS / utility-first at-rules so @apply doesn't warn
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'apply',
          'variants',
          'responsive',
          'layer',
          'screen',
          'tailwind',
          'unocss',
          'theme'
        ]
      }
    ]
  },
  ignoreFiles: ['**/node_modules/**']
}
