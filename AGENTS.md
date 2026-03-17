# AGENTS.md

Generally speaking, you should browse the codebase to figure out what is going on.

## Task Completion Requirements

- All of `bun fmt`, `bun lint`, and `bun typecheck` must pass before considering tasks completed.
- Never use `bun test`, use `bun run test` (runs Vitest).

## Project Snapshot

fm-gacha is a music gacha game site for users to casually collect cards relating to songs.

This repository is WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Visual consistency first. Adhere to the visual style of the existing site.

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there are shared logic that can be extracted to a separate module. Duplicate logic across mulitple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## Package Roles

- `convex/`: Contains all backend services and functions routed through Convex. Serving articles, images, and auth for example
- `src/`: TanStack Start + React UI and site structure.

## Expectations

- Use shadcn for base components `bunx --bun shadcn@latest add {component}`

## References

- Convex code demos: ~/Code/oss/convex-demos
- Clerk + Convex: https://clerk.com/docs/guides/development/integrations/databases/convex
- Skills: use ~/.agents/skills/find-skills to locate relevant skills wherever possible
- Last.fm API docs: `bunx ctx7 docs "/websites/last_fm_api" "{question}"`
- Idea inspiration: https://wikigacha.com/?lang=EN
- Visual style and audio component design: ~/Code/oss/destruct-web
