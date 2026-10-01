# CodeRacer — Agent Guidelines & Context

This repository contains **CodeRacer**, a multiplayer typing arcade game built for classroom and competitive typing.

## Key Directives for AI Agents

1. **Tech Stack Integrity:**
   - Framework: Next.js 15+ App Router (TypeScript strict mode, React 19).
   - Runtime: Bun. Use `bun add`, `bun test`, `bun run build`.
   - Data: PostgreSQL + Prisma 7 using `@prisma/adapter-pg`. Do not bypass adapter configuration in `src/lib/prisma.ts`.
   - Forms & Validation: Zod schemas in `src/lib/validations/` + React Hook Form.

2. **Artistic Direction ("Vibrant Classroom Arcade"):**
   - Main Canvas: `#f4f4ed` (Off-White).
   - UI Text: `#111112` (Dark Slate).
   - Calls to Action: `#d2ff00` (Electric Lime).
   - Competitor Colors: `#007BFF` (Azure), `#FF7A00` (Tangerine), `#D9008D` (Magenta), `#00BFA5` (Teal).
   - Fonts: `Nunito` for UI, `JetBrains Mono` for the typing arena.
   - Styling: Chunky tactile 3px borders, drop shadows (`arcade-shadow`), and rounded pill shapes.

3. **Gameplay Rules:**
   - Block paste events (`onPaste={(e) => e.preventDefault()}`) in all typing inputs.
   - WPM formula: `(correctChars / 5) / (elapsedSeconds / 60)`.
   - Support both Strict mode (must correct errors) and Permissive mode (penalty applied).
   - Minors protection: Only display player pseudonyms, never email or PII.

4. **Detailed Reference Skills:**
   - Review `.agents/skills/code-conventions/SKILL.md` for coding patterns.
   - Review `.agents/skills/artistic-direction-styling/SKILL.md` for UI components.
   - Review `.agents/skills/database-management/SKILL.md` for Prisma database workflows.
   - Review `.agents/skills/race-engine-realtime/SKILL.md` for race calculations & engine specs.
   - Review `.agents/skills/testing-and-qa/SKILL.md` for verification steps.
