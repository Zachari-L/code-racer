<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CodeRacer — Project Architecture & Agent Rules

Welcome to **CodeRacer**, a competitive classroom typing arcade web application built for students aged 12–17 and teachers, blending the solo practice of Monkeytype with the multiplayer energy of Kahoot.

---

## 1. Tech Stack Overview

- **Framework:** Next.js (App Router, Server Components & Server Actions)
- **Language:** TypeScript (strict mode enabled, no `any`)
- **Runtime & Tooling:** Bun (`bun install`, `bun test`, `bun run build`)
- **Database & ORM:** PostgreSQL + Prisma 7 (using `@prisma/adapter-pg` and `pg.Pool`)
- **Styling:** Tailwind CSS v4 (`@theme` tokens) + shadcn/ui primitives + Lucide React
- **Validation:** Zod schemas shared across forms and server actions
- **Forms:** React Hook Form + `@hookform/resolvers/zod`
- **Authentication:** NextAuth v5 (Auth.js) with JWT sessions, Credentials (username/password with `bcryptjs`), and Discord/GitHub OAuth
- **Deployment:** Fly.io with multi-stage standalone Dockerfile (`oven/bun`)

---

## 2. Code Conventions & Architectural Rules

### 2.1 Component Boundaries

- **Server Components by Default:** Fetch data and render static UI on the server.
- **Client Components (`"use client"`):** Use exclusively when user interaction (typing input, key events, local timers, websockets) or React hooks (`useState`, `useEffect`) are necessary.
- **File Structure:**
  - `src/app/` — App Router routes, layouts, and API handlers.
  - `src/components/ui/` — Tactile chunky arcade design primitives (`Button`, `Input`, `Card`, `Badge`).
  - `src/components/layout/` — Shell elements (`Navbar`, `Footer`).
  - `src/components/lobby/` — Lobby creation, joining, and configuration modals.
  - `src/components/race/` — Realtime typing arena, track visualizer, 3D cars, leaderboard.
  - `src/lib/` — Singletons (`prisma.ts`, `auth.ts`, `utils.ts`, `validations/`).
  - `src/types/` — Domain types (`race.ts`, `auth.ts`, `user.ts`).
  - `src/server/actions/` — Type-safe Next.js Server Actions.
  - `tests/` — Automated tests running on `bun test`.

### 2.2 Server Action Pattern

Every server action must:

1. Validate inputs using Zod `safeParse()`.
2. Return a standardized response shape: `{ success: true, data?: ... } | { success: false, error: string }`.
3. Handle errors without throwing unhandled exceptions to the client.

### 2.3 Database Management

- Always use the Prisma singleton from `@/lib/prisma`.
- Prisma 7 requires driver adapters (`@prisma/adapter-pg`). Never instantiate `new PrismaClient()` without the adapter.
- Keep schema changes synchronized via `bun run db:generate` and `bun run db:push`.

---

## 3. Artistic Direction ("Vibrant Classroom Arcade")

Always adhere strictly to the visual guidelines defined in `doc/artistic-direction.md`:

### Color Palette

- **Canvas Base:** Off-White (`#f4f4ed`) for background focus and reading ease.
- **Primary Text:** Dark Slate/Black (`#111112`) for high-contrast legibility.
- **Hype CTA:** Electric Lime (`#d2ff00`) strictly reserved for primary CTAs ("JOIN LOBBY", "START RACE") and player's personal progress.
- **Competitor Colors:**
  - Player 1: Azure Blue (`#007BFF`)
  - Player 2: Tangerine Orange (`#FF7A00`)
  - Player 3: Arcade Magenta (`#D9008D`)
  - Player 4: Victory Teal (`#00BFA5`)

### Typography

- **UI & Menus:** `Nunito` (rounded, curvy, energetic geometric sans).
- **Typing Arena:** `JetBrains Mono` (crisp, modern monospace with clear distinction between `0`/`O` and `1`/`l`).

### Tactile Shape Language

- 3px solid borders (`arcade-border-thick`, `border-3 border-slate-dark`).
- Heavy drop shadow: `box-shadow: 0 4px 0 #111112` (`arcade-shadow`).
- Pill buttons (`rounded-full`).
- **Hover & Animation Exclusivity:** Unclickable cards, containers, and preview widgets MUST NOT have hover animations, 3D tilts, or cursor sheen glares. ONLY clickable elements (buttons, links, active inputs) may move, scale, or change shadow on hover.

---

## 4. Race Engine & Gameplay Specifications

- **Capacity:** 2 to 100 participants per race.
- **Access Codes:** 6 numeric digits (`/^\d{6}$/`) for semi-public lobbies.
- **Anti-Cheat:** Paste event MUST be disabled in typing inputs (`onPaste={(e) => e.preventDefault()}`).
- **WPM Formula:** Standard typing calculation: `(characters typed / 5) / (minutes elapsed)`.
- **Modes:**
  - _Strict:_ Errors must be corrected before advancing.
  - _Permissive:_ Errors can be skipped, incurring a speed/accuracy penalty.
- **Bots:** 4 tiers: Easy (~30 WPM), Medium (~60 WPM), Hard (~90 WPM), Impossible (~130+ WPM).
- **Protection of Minors:** Never expose real names or emails. Display only chosen pseudonyms.

---

## 5. Verification Commands

Before concluding any work, verify all quality gates:

```bash
bun run typecheck     # TypeScript check with zero errors
bun test              # Run unit and engine tests
bun run build         # Production Next.js build verification
bun run lint          # ESLint code style
bun run format:check  # Prettier formatting
```
