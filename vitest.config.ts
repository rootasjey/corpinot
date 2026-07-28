import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'nuxt',
    pool: 'forks',
    dir: 'tests',
    include: ['**/*.test.ts'],
    environmentOptions: {
      nuxt: {
        domEnvironment: 'jsdom',
      },
    },
  },
})
