// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Corpinot - Personal Toughts, Shared Openly',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Personal thoughts shared openly on Corpinot' },
        
        // Additional meta tags
        { name: 'theme-color', content: '#0BA6DF' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://corpinot.cc' }
      ]
    }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },

  hub: {
    blob: true,
    cache: true,
    db: 'sqlite',
    kv: true,
  },

  image: {
    providers: {
      hubblob: {
        name: 'hubblob',
        provider: './providers/hubblob.ts',
      },
    },
  },

  modules: [
    '@nuxt/image',
    '@una-ui/nuxt',
    '@nuxthub/core',
    '@pinia/nuxt',
    'nuxt-auth-utils',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    // Private keys (only available on server-side)
    authSecret: process.env.NUXT_AUTH_SECRET,
    ai: {
      cloudflareKey: process.env.NUXT_AI_CLOUDFLARE_KEY || '',
      cloudflareAccountId: process.env.NUXT_AI_CLOUDFLARE_ACCOUNT_ID || ''
    },

    // Public keys (exposed to client-side)
    public: {
      authUrl: process.env.NUXT_AUTH_ORIGIN || 'http://localhost:3000',
      // Injected at build time; used in UI (About, header, footer)
      appVersion: computeVersion(),
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      // Bump to invalidate all previously rendered OG images
      ogStyleVersion: process.env.NUXT_PUBLIC_OG_STYLE_VERSION || '1',
      features: {
        aiWriter: process.env.NUXT_PUBLIC_FEATURE_AI_WRITER === 'true'
      }
    }
  },
  
  unocss: {
    preflight: true,
    icons: {
      scale: 1.0,
      extraProperties: {
        "display": "inline-block",
        "vertical-align": "middle",
      },
    },
    theme: {
      colors: {
        primary: {
          DEFAULT: '#687FE5',
          50: '#F4F5FF',
          100: '#E9EDFF',
          200: '#DDE2FF',
          300: '#CDD4FF',
          400: '#BCC7FF',
          500: '#687FE5',
          600: '#576ED3',
          700: '#4659B7',
          800: '#2E3E93',
          900: '#161F70',
        },
        // Colors used by generated "wrapper-43" utilities (checkbox shortcuts)
        'wrapper-43': {
          50: '#eff6ff',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          800: '#1e3a8a',
          900: '#172554',
        },
      },
    },
  },
  una: {
    prefix: "N",
    themeable: true,
  },
  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },
})

function computeVersion(): string {
  // Prefer latest git tag like v1.2.3; fallback to package.json version
  try {
    const tag = execSync("git describe --tags --match 'v[0-9]*.[0-9]*.[0-9]*' --abbrev=0", {
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim()
    return tag.replace(/^v/, '')
  } catch {}

  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8') as unknown as string)
    return pkg.version || '0.0.0'
  } catch {}

  return '0.0.0'
}
