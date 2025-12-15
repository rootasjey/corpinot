# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Editor linting & @apply warnings

If your editor shows warnings like `Unknown at rule @apply (css(unknownAtRules))`, this is the CSS language server / stylelint complaining about framework-specific at-rules used by utility-first engines (Tailwind / UnoCSS).

This repo includes a project-level `.stylelintrc.cjs` which whitelists common utility at-rules (eg. `apply`, `layer`, `screen`) so stylelint doesn't raise false positives. There's also a `.vscode/settings.json` which silences the CSS language server's unknown at-rule warnings in the workspace.

If you rely on an alternative editor/IDE or different lint setup, add those same ignores to your stylelint config or workspace settings.

## AI writer (Cloudflare Workers AI)

- Set `NUXT_AI_CLOUDFLARE_ACCOUNT_ID` and `NUXT_AI_CLOUDFLARE_KEY` in your environment (see `.env.example`).
- Enable the UI with `NUXT_PUBLIC_FEATURE_AI_WRITER=true`.
- The server streams via the Vercel AI SDK + `workers-ai-provider` using model `@cf/openai/gpt-oss-120b`.
