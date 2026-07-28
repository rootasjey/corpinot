import { createError } from 'h3'
import type { H3Event } from 'h3'
//// @ts-expect-error useNitroApp not yet typed
import { useNitroApp, useEvent } from '#imports'

function getBrowserBinding(name: string = 'BROWSER') {
  // @ts-expect-error globalThis.__env__ is not typed
  return process.env[name] || globalThis.__env__?.[name] || globalThis[name]
}

interface HubBrowserOptions {
  keepAlive?: number
}

interface HubBrowser {
  browser: any
  page: any
}

let _browserPromise: Promise<any> | null = null
let _browser: any = null
/**
 * Get a browser instance (puppeteer)
 *
 * @example ```ts
 * const { page } = await hubBrowser()
 * await page.goto('https://hub.nuxt.com')
 * const img = await page.screenshot()
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/browser
 * @deprecated See https://hub.nuxt.com/docs/features/browser#migration-guide for more information.
 */
let _cfModule: any = null
async function getCFPuppeteer() {
  if (!_cfModule) {
    _cfModule = await import('@cloudflare/puppeteer')
  }
  return _cfModule.default
}

export async function hubBrowser(options: HubBrowserOptions = {}): Promise<HubBrowser> {
  const nitroApp = useNitroApp()
  const event = useEvent()

  if (!import.meta.dev) {
    const puppeteer = await getCFPuppeteer()
    const binding = getBrowserBinding()
    if (!binding) {
      throw createError('Missing Cloudflare Browser binding (BROWSER)')
    }
    let browser: any = null
    const sessionId = await getRandomSession(puppeteer, binding)
    if (sessionId) {
      try {
        browser = await puppeteer.connect(binding, sessionId)
      } catch (e) {
        // another worker may have connected first
      }
    }
    if (!browser) {
      browser = await puppeteer.launch(binding, {
        keep_alive: (options.keepAlive || 60) * 1000
      })
    }
    const page = await browser.newPage()
    const unregister = nitroApp.hooks.hook('afterResponse', async (closingEvent: H3Event) => {
      if (event !== closingEvent) return
      unregister()
      await page?.close().catch(() => {})
      browser?.disconnect()
    })
    return { browser, page }
  }

  const puppeteer = await getLocalPuppeteer()
  if (!_browserPromise) {
    _browserPromise = puppeteer.launch()
    nitroApp.hooks.hook('close', async () => {
      const browser = _browser || await _browserPromise
      browser?.close()
      _browserPromise = null
      _browser = null
    })
  }
  if (!_browser) {
    _browser = await _browserPromise
    _browser.disconnect = () => Promise.resolve()
  }
  const page = await _browser.newPage()
  const unregister = nitroApp.hooks.hook('afterResponse', async (closingEvent: H3Event) => {
    if (event !== closingEvent) return
    unregister()
    await page?.close().catch(() => {})
  })
  return { browser: _browser, page }
}

async function getRandomSession(puppeteer: any, binding: any): Promise<string | null> {
  const sessions = await puppeteer.sessions(binding)
  const sessionsIds = sessions
    .filter((v: any) => !v.connectionId)
    .map((v: any) => v.sessionId)

  if (!sessionsIds.length) return null
  return sessionsIds[Math.floor(Math.random() * sessionsIds.length)]
}

async function getLocalPuppeteer() {
  if (_localPuppeteer) return _localPuppeteer
  _localPuppeteer = await import('puppeteer').catch(() => {
    throw new Error('Package `puppeteer` not found, please install it with: `npx nypm i puppeteer`')
  })
  return _localPuppeteer
}
let _localPuppeteer: any = null
