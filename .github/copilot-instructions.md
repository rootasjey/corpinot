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
postellar/
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

### Coding conventions (avoid past mistakes)

- Prefer static imports at the top of the file unless a dynamic import is required for conditional loading or to avoid a deliberate runtime dependency. Static imports make the code easier to analyze, refactor, and test.
- Prefer using Nuxt/Vite path aliases (e.g. `~~/server/...`, `~/`, `@/`) instead of long relative imports when referencing top-level app/server files. This keeps imports stable and easier to move/rename across the codebase. Reserve relative imports for tightly-coupled local modules within the same directory.
- Avoid nested try/catch blocks — they quickly become hard to reason about and hide the real error flow. Prefer single-level try/catch, `Promise.catch()` for fire-and-forget tasks, or small helper functions for isolated error handling.
- Avoid nested try/catch blocks — they quickly become hard to reason about and hide the real error flow. Prefer single-level try/catch, `Promise.catch()` for fire-and-forget tasks, or small helper functions for isolated error handling.
- Prefer guard clauses and small helpers instead of deeply nested if/else. Keep function bodies short and focused — if additional branches are required, extract the branch logic into a helper with a descriptive name so the main flow remains easy to read and test.
- Do not leave comments describing previous implementations or “moved code” history in new commits. The code should be self-explanatory; use concise comments for intent only (not history). If you need to describe why a change was made, prefer a clear commit message or issue reference.

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

## Database Access
Local development: You can query the SQLite database directly for debugging/inspection.
Database location: .data/hub/d1/miniflare-D1DatabaseObject/7b8799eb95f0bb5448e259812996a461ce40142dacbdea254ea597e307767f45.sqlite
Example query:

sqlite3 .data/hub/d1/miniflare-D1DatabaseObject/7b8799eb95f0bb5448e259812996a461ce40142dacbdea254ea597e307767f45.sqlite "SELECT id, answer, metadata FROM activity_cards WHERE activity_id = (SELECT id FROM activities WHERE code='a1-2-countries') AND answer LIKE 'L''Australie'"

Migrations: All schema changes must be done via SQL migrations in server/database/migrations/. Never modify the database directly in production.

## Server route conventions
- Use `eventHandler` and validate route params with zod + `getValidatedRouterParams` (see `server/routes/images/[pathname].get.ts`).
- Access query with `getQuery(event)`; prefer explicit parsing/validation for public endpoints.
- Route files follow Nitro conventions: folder + `[param].<method>.ts` determines the HTTP method.

## UI and styling
- UnoCSS configured in `unocss.config.ts` with: wind3 preset, icons, animations, Una preset, custom webfonts, shortcuts (e.g., `btn-glowing`, `social-btn`). A few icons are safelisted for dynamic usage.
- Una UI is enabled with prefix `N` and themeable components.
- **Important:** Una UI does NOT have an `NTextarea` component. Use `<NInput type="textarea" :rows="number" />` instead for multiline text inputs.
 - Una UI is enabled with prefix `N` and themeable components.
 - **Important:** Una UI does NOT have an `NTextarea` component. Use `<NInput type="textarea" :rows="number" />` instead for multiline text inputs.
 - **Styling props:** Una UI uses different prop names for visual styles on components:
   - `NButton` uses `btn` (not `variant`) to apply visual styles, e.g. `btn="outline"` or `btn="ghost"`. Example:
     - `<NButton btn="outline" color="primary">Outline</NButton>`
   - `NInput` uses `input` (not `variant`) to choose the visual style, e.g. `input="outline"`:
     - `<NInput input="outline" placeholder="Name" />`
   - `NBadge` uses `badge` (not `variant`) for its style, e.g. `badge="soft"`:
     - `<NBadge badge="soft">Draft</NBadge>`
   - `NButton` still accepts `size`, `color`, `icon` etc. as usual.
   - If you're trying to theme or theme-variant a component, prefer `btn`, `input`, and `badge` for Una UI components.
- Drawer components: When creating drawer/modal components, always use placement="bottom" for NDrawer and use the #body slot (not #default). Match the pattern from existing drawers like FrenchydexCardEditorDrawer.vue.

## Auth types extension
- `shared/types/auth.d.ts` augments `#auth-utils` `User` fields used across the app. Extend here for additional user/session types to keep types in sync.

## Notes and integration hints
- Hub integration is enabled in `nuxt.config.ts` (`hub` block). Blob access is mediated via `hubBlob()` in server code; keep blob reads/writes server-side.
- Puppeteer dependencies exist in `package.json` but are not referenced in this repo yet—check usage before adding new automation features.
 - We use `@vueuse/core` liberally for Vue/Nuxt utilities and helpers. Feel free to use composables like `watchDebounced`, `useDebounceFn`, `useEventListener`, `useStorage`, `useKeyModifier`, etc., when they make the code cleaner or easier to test. Example patterns:
   - Debounced watchers: `watchDebounced(slug, (v) => checkSlug(v), { debounce: 450 })` — prefer this over manual setTimeout/clearTimeout.
   - Debounced functions: `const saveDebounced = useDebounceFn(save, 500)` for throttled/debounced actions.
   - Abortable or client-only helpers: `useAbortableFetch` or `isClient` guards are useful when you need to prevent server-side execution.
 - Note: Some `@vueuse` utilities are client-only; when in doubt, guard with `if (process.client)` or `if (useNuxtApp().isClient)`. Also prefer composables for simpler tests and re-use.
- Deprecated API: Do not use process.client (deprecated). Use import.meta.client instead for client-side checks.

### TypeScript guidance (avoid `as any`)

- Avoid `as any` casts unless there's no viable alternative — they defeat TypeScript's safety and slow down future refactors. Use type guards, `unknown`, or proper union types instead; prefer `ComponentPublicInstance` or `InstanceType<...>` when dealing with template refs bound to components. If `as any` is used, please add a short comment explaining why and open an issue to refine types later.

Challenge instructions if unclear, incomplete, or inconsistent. Propose alternatives if better suited to the context.
If anything above is unclear or you see gaps (e.g., additional image categories, auth/session flows, or explicit migration commands), call it out and I’ll refine these instructions.