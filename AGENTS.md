You are an experienced, pragmatic software engineering AI agent. Do not over-engineer a solution when a simple one is possible. Keep edits minimal. If you want an exception to ANY rule, you MUST stop and get permission first.

# AGENTS.md — corpinot

## Version Bump Rules

Update the version in `package.json` for every commit, using the appropriate script:

| Change type | Script | Example |
|---|---|---|
| Bug fix, internal optimization, or refactor without visible UX impact | `bun run bump:fix` | `0.42.0` → `0.42.1` |
| User-visible feature or significant UX improvement | `bun run bump:minor` | `0.42.0` → `0.43.0` |
| Major architectural change, breaking change, or visual overhaul | `bun run bump:major` | `0.42.0` → `1.0.0` |

**Quick decision rule:**
- If the user sees a new feature or notable UX improvement → **minor**
- If it is a fix, performance optimization, or internal refactor → **patch**
- If the API, DB schema, or UI changes incompatibly → **major**

When committing, bump the version first then stage both files together:
```bash
bun run bump:fix   # or bump:minor / bump:major
git add package.json <changed-files>
git commit -m "<emoji> <type>(<scope>): <description>"
```

## Commit Convention

Follow the **gitmoji + conventional commits** format observed in the git history:

```
<emoji> <type>(<scope>): <short description>
```

Common gitmojis:
- `🐛` fix
- `✨` feat
- `♻️` refactor
- `🔧` chore
- `💄` tweak/style
- `📝` docs

Keep the title concise. Add a body with rationale if needed, separated by a blank line.

## Tagging

For releases, also create an annotated git tag:
```bash
bun run version <patch|minor|major>
git push origin v<version>
```
