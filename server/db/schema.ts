import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  avatar: text('avatar').notNull().default(''),
  biography: text('biography').notNull().default(''),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  email: text('email').notNull().unique(),
  email_verified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  job: text('job').notNull().default(''),
  language: text('language').notNull().default('en'),
  last_login_at: text('last_login_at'),
  location: text('location').notNull().default(''),
  name: text('name').notNull().unique(),
  slug: text('slug'),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  socials: text('socials').notNull().default('[]'),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  blob_path: text('blob_path'),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  description: text('description'),
  image_alt: text('image_alt'),
  image_ext: text('image_ext'),
  image_src: text('image_src'),
  language: text('language').notNull().default('en'),
  links: text('links').notNull().default('{}'),
  metrics_comments: integer('metrics_comments').notNull().default(0),
  metrics_likes: integer('metrics_likes').notNull().default(0),
  metrics_views: integer('metrics_views').notNull().default(0),
  name: text('name').notNull(),
  published_at: text('published_at'),
  slug: text('slug').notNull().unique(),
  status: text('status').notNull().default('draft'),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  user_id: integer('user_id').notNull(),
})

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  category: text('category').notNull().default('general'),
  description: text('description').notNull().default(''),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const post_tags = sqliteTable('post_tags', {
  post_id: integer('post_id').notNull(),
  tag_id: integer('tag_id').notNull(),
})

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  ip_address: text('ip_address'),
  message: text('message').notNull(),
  priority: text('priority').notNull().default('normal'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  sender_email: text('sender_email').notNull(),
  spam: integer('spam', { mode: 'boolean' }).notNull().default(false),
  subject: text('subject').notNull(),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const newsletter_subscribers = sqliteTable('newsletter_subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  user_id: integer('user_id'),
  status: text('status').notNull().default('subscribed'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  confirmed_at: text('confirmed_at'),
  resend_message_id: text('resend_message_id'),
  metadata: text('metadata').notNull().default('{}'),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const post_images = sqliteTable('post_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  post_id: integer('post_id').notNull(),
  pathname: text('pathname').notNull().unique(),
  filename: text('filename').notNull(),
  content_type: text('content_type'),
  size: integer('size'),
  in_use: integer('in_use', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const post_videos = sqliteTable('post_videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  post_id: integer('post_id').notNull(),
  pathname: text('pathname').notNull().unique(),
  filename: text('filename').notNull(),
  content_type: text('content_type'),
  size: integer('size'),
  poster_path: text('poster_path'),
  poster_filename: text('poster_filename'),
  in_use: integer('in_use', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const post_audios = sqliteTable('post_audios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  post_id: integer('post_id').notNull(),
  pathname: text('pathname').notNull().unique(),
  filename: text('filename').notNull(),
  content_type: text('content_type'),
  size: integer('size'),
  in_use: integer('in_use', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const ai_requests = sqliteTable('ai_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull(),
  post_id: integer('post_id'),
  action: text('action').notNull(),
  provider: text('provider').notNull().default('cloudflare'),
  tokens_input: integer('tokens_input'),
  tokens_output: integer('tokens_output'),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const site_settings = sqliteTable('site_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull().default('{}'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})
