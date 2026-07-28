#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { EneideClient, EneideApiError } from '@eneide/sdk'

const CONFIG_DIR = join(homedir(), '.config', 'eneide')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

function loadConfig(): { baseUrl?: string; apiKey?: string } {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

function saveConfig(config: { baseUrl?: string; apiKey?: string }) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

function createClient(): EneideClient {
  const config = loadConfig()
  if (!config.baseUrl) {
    console.error('Error: No base URL configured. Run: eneide config set-base-url <url>')
    process.exit(1)
  }
  return new EneideClient({ baseUrl: config.baseUrl, apiKey: config.apiKey })
}

function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

const program = new Command()

program
  .name('eneide')
  .description('CLI for Énéide CMS')
  .version('0.1.0')

// config
const configCmd = program.command('config').description('Manage CLI configuration')

configCmd
  .command('set-base-url')
  .argument('<url>', 'API base URL (e.g. https://corpinot.cc)')
  .action((url: string) => {
    const config = loadConfig()
    config.baseUrl = url.replace(/\/+$/, '')
    saveConfig(config)
    console.log(`Base URL set to: ${config.baseUrl}`)
  })

configCmd
  .command('set-api-key')
  .argument('<key>', 'API key')
  .action((key: string) => {
    const config = loadConfig()
    config.apiKey = key
    saveConfig(config)
    console.log('API key saved')
  })

configCmd
  .command('show')
  .description('Show current configuration (excluding secrets)')
  .action(() => {
    const config = loadConfig()
    const { apiKey: _, ...safe } = config
    console.log(formatJson({ ...safe, apiKey: config.apiKey ? '***' : undefined }))
  })

// posts
const postsCmd = program.command('posts').description('Manage posts')

postsCmd
  .command('list')
  .description('List published posts')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-l, --limit <number>', 'Items per page', '25')
  .option('-s, --search <query>', 'Search term')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-a, --author <author>', 'Filter by author (id, slug, or name)')
  .option('-L, --language <lang>', 'Filter by language (en, fr, es, de, it)')
  .action(async (options) => {
    try {
      const client = createClient()
      const result = await client.getPosts(options)
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

postsCmd
  .command('get')
  .description('Get a single post by slug')
  .argument('<slug>', 'Post slug')
  .action(async (slug: string) => {
    try {
      const client = createClient()
      const result = await client.getPost(slug)
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

postsCmd
  .command('create')
  .description('Create a new post')
  .requiredOption('-n, --name <name>', 'Post name')
  .option('-d, --description <desc>', 'Post description')
  .option('-s, --status <status>', 'Post status (draft|published|archived)')
  .option('-t, --tags <tags>', 'Comma-separated tag names')
  .action(async (options) => {
    try {
      const client = createClient()
      const tags = options.tags
        ? options.tags.split(',').map((t: string) => ({ name: t.trim() }))
        : undefined
      const result = await client.createPost({ name: options.name, description: options.description, status: options.status, tags })
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

postsCmd
  .command('update')
  .description('Update a post')
  .argument('<identifier>', 'Post ID or slug')
  .option('-n, --name <name>', 'Post name')
  .option('-d, --description <desc>', 'Post description')
  .option('-s, --slug <slug>', 'Post slug')
  .option('--status <status>', 'Post status (draft|published|archived)')
  .option('-l, --language <lang>', 'Language (en|fr|es|de|it)')
  .option('-t, --tags <tags>', 'Comma-separated tag names')
  .action(async (identifier: string, options) => {
    try {
      const client = createClient()
      const payload: Record<string, any> = {}
      if (options.name) payload.name = options.name
      if (options.description) payload.description = options.description
      if (options.slug) payload.slug = options.slug
      if (options.status) payload.status = options.status
      if (options.language) payload.language = options.language
      if (options.tags) payload.tags = options.tags.split(',').map((t: string) => ({ name: t.trim() }))
      const result = await client.updatePost(identifier, payload)
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

postsCmd
  .command('delete')
  .description('Delete a post')
  .argument('<identifier>', 'Post ID or slug')
  .action(async (identifier: string) => {
    try {
      const client = createClient()
      const result = await client.deletePost(identifier)
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

// tags
const tagsCmd = program.command('tags').description('Manage tags')

tagsCmd
  .command('list')
  .description('List all tags')
  .option('-c, --category <category>', 'Filter by category')
  .option('-s, --search <query>', 'Search tags')
  .action(async (options) => {
    try {
      const client = createClient()
      const result = await client.getTags(options)
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

tagsCmd
  .command('create')
  .description('Create a new tag')
  .requiredOption('-n, --name <name>', 'Tag name')
  .option('-c, --category <category>', 'Tag category')
  .option('-d, --description <desc>', 'Tag description')
  .action(async (options) => {
    try {
      const client = createClient()
      const result = await client.createTag({ name: options.name, category: options.category, description: options.description })
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

tagsCmd
  .command('update')
  .description('Update a tag')
  .argument('<id>', 'Tag ID')
  .requiredOption('-n, --name <name>', 'Tag name')
  .option('-c, --category <category>', 'Tag category')
  .option('-d, --description <desc>', 'Tag description')
  .action(async (id: string, options) => {
    try {
      const client = createClient()
      const result = await client.updateTag(Number(id), { name: options.name, category: options.category, description: options.description })
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

tagsCmd
  .command('delete')
  .description('Delete a tag')
  .argument('<id>', 'Tag ID')
  .action(async (id: string) => {
    try {
      const client = createClient()
      const result = await client.deleteTag(Number(id))
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

// authors
const authorsCmd = program.command('authors').description('Manage authors')

authorsCmd
  .command('list')
  .description('List all authors')
  .action(async () => {
    try {
      const client = createClient()
      const result = await client.getAuthors()
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

authorsCmd
  .command('get')
  .description('Get an author by ID')
  .argument('<id>', 'Author ID')
  .action(async (id: string) => {
    try {
      const client = createClient()
      const result = await client.getAuthor(Number(id))
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

// stats
program
  .command('stats')
  .description('Get blog statistics')
  .action(async () => {
    try {
      const client = createClient()
      const result = await client.getStats()
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

// search
program
  .command('search')
  .description('Search posts')
  .argument('<query>', 'Search query')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-l, --limit <number>', 'Items per page', '25')
  .option('-L, --language <lang>', 'Filter by language')
  .action(async (query: string, options) => {
    try {
      const client = createClient()
      const result = await client.search(query, options)
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

// site-settings
program
  .command('site-settings')
  .description('Get public site settings')
  .action(async () => {
    try {
      const client = createClient()
      const result = await client.getSiteSettings()
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

// api-keys (admin only)
const apiKeysCmd = program.command('api-keys').description('Manage API keys (admin only)')

apiKeysCmd
  .command('list')
  .description('List all API keys')
  .action(async () => {
    try {
      const client = createClient()
      const result = await client.listApiKeys()
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

apiKeysCmd
  .command('create')
  .description('Create a new API key')
  .argument('<name>', 'Key name')
  .action(async (name: string) => {
    try {
      const client = createClient()
      const result = await client.createApiKey(name)
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

apiKeysCmd
  .command('revoke')
  .description('Revoke an API key')
  .argument('<id>', 'Key ID')
  .action(async (id: string) => {
    try {
      const client = createClient()
      const result = await client.revokeApiKey(Number(id))
      console.log(formatJson(result))
    } catch (err) {
      handleError(err)
    }
  })

function handleError(err: unknown) {
  if (err instanceof EneideApiError) {
    console.error(`Error [${err.code}] (${err.status}): ${err.message}`)
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`)
  } else {
    console.error('Unknown error')
  }
  process.exit(1)
}

program.parse()
