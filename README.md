# Énéide 🚀

> A modern, full-featured blogging platform powered by Nuxt 4 — built for curious minds and creative builders.

![Corpinot Home](./screenshots/corpinot-home-desktop-1.jpeg)

## ✨ What is Énéide?

Énéide is a next-generation blogging platform and CMS, designed for simplicity, speed, and delightful content creation. Built on cutting-edge web technologies, it offers a seamless experience for writers, readers, and content managers.

### Architecture

Énéide is the **platform** — the API, SDK, and CLI — that powers individual blog deployments (called *tenants*). Each tenant is a fully customized Nuxt frontend:

```
Énéide                    ← platform (API, SDK, CLI)
├── corpinot.cc           ← tenant blog
├── paul.fr               ← another tenant
└── ...
```

### 📦 Monorepo Structure

```
├── server/               ← Nitro API server (Nuxt 4)
│   ├── api/v1/           ← REST API v1 endpoints
│   ├── db/               ← Drizzle schema + migrations
│   └── utils/            ← Server utilities
├── app/                  ← Tenant frontend (corpinot.cc)
├── packages/
│   ├── sdk/              ← @eneide/sdk — TypeScript SDK
│   └── cli/              ← @eneide/cli — CLI tool
├── shared/types/         ← Shared TypeScript types
└── ...
```

### 🎯 Key Features

- **🎨 Rich Content Editor** — TipTap-powered editor with support for images, videos, audio, code blocks, tables, and more
- **⚡ Lightning Fast** — Built on Nuxt 4 with SSR, SSG, and edge deployment via NuxtHub/Cloudflare Workers
- **🤖 AI-Powered Writing** — Integrated AI writer using Cloudflare Workers AI for content generation and suggestions
- **📱 Mobile-First Design** — Responsive UI with dedicated mobile experiences using UnoCSS and Una UI
- **🏷️ Smart Tagging System** — Organize content with categories, featured posts, and trending tags
- **👥 Multi-Author Support** — User management with profiles, avatars, and author pages
- **🔍 Full-Text Search** — Fast search across posts, tags, and authors
- **📧 Newsletter Integration** — Built-in newsletter subscription system
- **🌙 Dark Mode** — Beautiful light and dark themes

### API v1

The REST API v1 is available at `/api/v1/` with a consistent JSON format:

```
GET  /api/v1/posts          List published posts (paginated, filterable)
GET  /api/v1/posts/:slug    Get a single post
GET  /api/v1/tags           List tags
GET  /api/v1/authors        List authors
GET  /api/v1/authors/:id    Get an author
GET  /api/v1/stats          Blog statistics
GET  /api/v1/search?q=      Search posts
GET  /api/v1/site-settings  Public site settings
```

### SDK — `@eneide/sdk`

```ts
import { EneideClient } from '@eneide/sdk'

const client = new EneideClient({ baseUrl: 'https://corpinot.cc' })

const { data: posts, meta } = await client.getPosts({ page: 1, limit: 10 })
const { data: post } = await client.getPost('my-article')
```

### CLI — `@eneide/cli`

```bash
npx eneide config set-base-url https://corpinot.cc
eneide posts list --limit 10 --tag javascript
eneide posts get my-article
eneide stats
```

### 🛠️ Tech Stack

- **Framework:** [Nuxt 4](https://nuxt.com/) (TypeScript)
- **UI:** [Una UI](https://una-ui.com/) + [UnoCSS](https://unocss.dev/)
- **Editor:** [TipTap](https://tiptap.dev/) (extensible rich-text editor)
- **Database:** SQLite via [Drizzle ORM](https://orm.drizzle.team/)
- **Storage:** Cloudflare R2 via [@nuxthub/core](https://hub.nuxt.com/)
- **Deployment:** [NuxtHub](https://hub.nuxt.com/) / Cloudflare Workers
- **SDK/CLI:** TypeScript, published on npm as `@eneide/sdk` and `@eneide/cli`

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- A Cloudflare account (for deployment)

### Installation

```bash
git clone https://github.com/rootasjey/eneide.git
cd eneide
bun install
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
bun run dev
```

### Build & Preview

```bash
bun run build
bun run preview
```

### SDK / CLI

Build the packages:

```bash
bun run sdk:build
bun run cli:build
# or both:
bun run packages:build
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```bash
# AI Writer (optional)
NUXT_AI_CLOUDFLARE_ACCOUNT_ID=your_account_id
NUXT_AI_CLOUDFLARE_KEY=your_api_key
NUXT_PUBLIC_FEATURE_AI_WRITER=true

# Site URL
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database Setup

The database is automatically initialized on first run. Migrations are in `server/db/migrations/`.

---

## 📝 Content Management

### Creating Posts

1. Sign in to the platform
2. Click "New Post" from the header or profile menu
3. Use the rich TipTap editor to create your content
4. Add tags, cover image, and metadata
5. Publish when ready

### Editor Features

- **Rich Text Formatting** — Bold, italic, headings, lists, quotes, and more
- **Media Support** — Images, videos, and audio files
- **Code Blocks** — Syntax-highlighted code with language selection
- **Tables** — Create and edit tables inline
- **AI Assistant** — Generate content suggestions with AI
- **Auto-save** — Never lose your work

### Post Status

- **Draft** — Work in progress, not visible to public
- **Published** — Live and visible to all readers
- **Archived** — Hidden from public view but preserved

---

## 🚢 Deployment

### NuxtHub / Cloudflare Workers

1. Create a [NuxtHub](https://hub.nuxt.com/) account
2. Link your repository
3. Configure environment variables
4. Deploy with:

```bash
npx nuxthub deploy
```

### Traditional Node Server

```bash
bun run build
node .output/server/index.mjs
```

---

## 📸 Screenshots

| Desktop Home | Mobile Post |
|--------------|-------------|
| ![Desktop](./screenshots/corpinot-home-desktop-1.jpeg) | ![Mobile](./screenshots/corpinot-post-mobile-1.jpeg) |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT

---

<div align="center">

**[Report Bug](https://github.com/rootasjey/eneide/issues)** • **[Request Feature](https://github.com/rootasjey/eneide/issues)**

Made with ❤️ by [rootasjey](https://github.com/rootasjey)

</div>
