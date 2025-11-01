# Copilot instructions for this repo (poststellar)

These notes help AI agents navigate and extend this Nuxt 4 app quickly and correctly.

## Big picture
- Framework: Nuxt 4 (TypeScript) with Pinia, UnoCSS + Una UI, and @nuxt/image.
- Platform integrations via @nuxthub/core: hub features enabled for blob, cache, database, kv, and browser (see `nuxt.config.ts`).
- Server routes live under `server/routes/**` (Nitro). Database schema is defined in `server/database/migrations/schema.sql`.
- Custom image provider wired to @nuxt/image in `providers/hubblob.ts` and served by `server/routes/images/[pathname].get.ts` via `hubBlob().serve(...)`.

## Project structure
All frontend-related code must live inside the `app/` directory. This follows Nuxt 4's recommended structure:

```
my-nuxt-app/
├─ app/
│  ├─ assets/           # Stylesheets, fonts, images processed by build tools
│  ├─ components/       # Vue components auto-imported throughout the app
│  ├─ composables/      # Auto-imported composables (reusable logic)
│  ├─ layouts/          # Layout wrappers for pages
│  ├─ middleware/       # Route middleware (auth, navigation guards, etc.)
│  ├─ pages/            # File-based routing (each file = a route)
│  ├─ plugins/          # Nuxt plugins for app-level extensions
│  ├─ utils/            # Auto-imported utility functions
│  ├─ app.vue           # Root Vue component
│  ├─ app.config.ts     # App-level configuration (runtime, not build-time)
│  └─ error.vue         # Global error page component
├─ content/             # Nuxt Content files (if using @nuxt/content)
├─ public/              # Static assets served as-is (robots.txt, favicon, etc.)
├─ shared/              # Shared types and utilities (e.g., auth.d.ts, post.d.ts)
├─ server/              # Nitro server routes, API endpoints, and utilities
└─ nuxt.config.ts       # Nuxt configuration (modules, build settings, etc.)
```

**Key rules:**
- Place all Vue components in `app/components/` for auto-import.
- Store composables in `app/composables/` (naming convention: `useSomething.ts`).
- Use `app/pages/` for file-based routing; dynamic routes use `[param].vue`.
- Add global CSS in `app/styles/` and import in `app.vue`.
- Type definitions shared between client and server go in `shared/types/`.
- Server-only code (API routes, database utilities) belongs in `server/`.

## Dev workflows
- Scripts (see `package.json`):
  - `bun run dev` (or `npm run dev`) – start local dev server.
  - `bun run build` – production build.
  - `bun run generate` – SSG output (if used).
  - `bun run preview` – preview a build.
  - `postinstall` runs `nuxt prepare`.
- Runtime config: the image provider uses `useRuntimeConfig().public.siteUrl` when `baseURL` isn’t provided. Set `NUXT_PUBLIC_SITE_URL` in env for correct absolute image URLs in dev/prod.

## Images flow (important)
- Frontend uses @nuxt/image with a custom provider (`providers/hubblob.ts`).
  - If `src` starts with `/projects/` or `/posts/`, the provider rewrites to the internal route: `/images/:filename?relatedTo=:category&slug=:slug[&modifiers...]`.
  - Otherwise it joins `baseURL` (defaults to `public.siteUrl`) with the raw `src`.
- The server handler `server/routes/images/[pathname].get.ts`:
  - Validates `pathname` with zod via `getValidatedRouterParams`.
  - Reads query (`relatedTo`, `slug`, plus any @nuxt/image modifiers).
  - Reconstructs blob path as `${relatedTo}/${slug}/${pathname}` when `relatedTo` is present, and serves with `hubBlob().serve(event, imagePathname)`.
- Example (usage on the client): `<NuxtImg src="/posts/my-slug/header.png" width="800" format="webp" />` → provider proxies to `/images/header.png?relatedTo=posts&slug=my-slug&w=800&format=webp` and serves from blob.
- To introduce a new top-level image category (e.g. `/avatars/...`), extend the prefix handling in `providers/hubblob.ts` so it’s rewritten through `/images/*` similarly to `posts` and `projects`.

## Data model and constraints
- Schema location: `server/database/migrations/schema.sql` (SQLite/D1 via nuxthub). Core tables:
  - `users` with unique `email` and `name`, language enum `('en','fr','es','de','it')`, audit timestamps, and trigger to update `updated_at`.
  - `posts` with unique `slug`, status enum `('draft','published','archived')`, metrics counters (non-negative), optional `blob_path` and image fields, FK to `users`.
  - `tags` and `post_tags` (many-to-many), plus `messages` with `priority` enum and indices for common filters.
- Triggers maintain `updated_at` across tables; keep them intact when altering schema.

## Server route conventions
- Use `eventHandler` and validate route params with zod + `getValidatedRouterParams` (see `server/routes/images/[pathname].get.ts`).
- Access query with `getQuery(event)`; prefer explicit parsing/validation for public endpoints.
- Route files follow Nitro conventions: folder + `[param].<method>.ts` determines the HTTP method.

## UI and styling
- UnoCSS configured in `unocss.config.ts` with: wind3 preset, icons, animations, Una preset, custom webfonts, shortcuts (e.g., `btn-glowing`, `social-btn`). A few icons are safelisted for dynamic usage.
- Una UI is enabled with prefix `N` and themeable components.

## Auth types extension
- `shared/types/auth.d.ts` augments `#auth-utils` `User` fields used across the app. Extend here for additional user/session types to keep types in sync.

## Notes and integration hints
- Hub integration is enabled in `nuxt.config.ts` (`hub` block). Blob access is mediated via `hubBlob()` in server code; keep blob reads/writes server-side.
- Puppeteer dependencies exist in `package.json` but are not referenced in this repo yet—check usage before adding new automation features.

If anything above is unclear or you see gaps (e.g., additional image categories, auth/session flows, or explicit migration commands), call it out and I’ll refine these instructions.