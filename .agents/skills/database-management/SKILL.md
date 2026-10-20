---
name: database-management
description: >-
  Use this skill when modifying the database schema, creating or executing Prisma migrations,
  seeding the database, or writing database queries and indexes for CodeRacer.
---

# CodeRacer Database Management & Prisma 7 Runbook

This runbook describes database schema management, migrations, and query patterns for CodeRacer using PostgreSQL and Prisma 7.

---

## 1. Prisma 7 Architecture Requirements

Prisma 7 uses direct driver adapters instead of embedded query engines:
- Driver: `@prisma/adapter-pg`
- Connection pool: `pg.Pool`
- Schema config in `prisma/schema.prisma`

### Prisma Client Singleton (`src/lib/prisma.ts`)
Always import `prisma` from `@/lib/prisma`:
```typescript
import { prisma } from "@/lib/prisma";
```
Never construct `new PrismaClient()` directly in routes or actions, as this will bypass the connection pool.

---

## 2. Managing Schema Changes

When modifying `prisma/schema.prisma`:

1. **Validate schema syntax:**
   ```bash
   bunx prisma validate
   ```

2. **Generate the type-safe client:**
   ```bash
   bun run db:generate
   ```

3. **Create and apply a migration:**
   ```bash
   bun run db:migrate
   ```

4. **Seed sample texts and badges:**
   ```bash
   bun run db:seed
   ```

5. **Inspect data in Prisma Studio:**
   ```bash
   bun run db:studio
   ```

---

## 3. Core Models & Relations

- `User`: Standard accounts, OAuth connections, and credentials (`passwordHash` with `bcryptjs`).
- `UserStats`: Summary stats (average WPM, accuracy, wins, total races).
- `Race`: Rooms, 6-digit access code, difficulty, strict/permissive mode, text snippet.
- `Participant`: Live state in room, car color, guest nickname or user link, progress, current WPM.
- `RaceResult`: Permanent records of completed races with rank, accuracy, WPM, and keyboard error heatmap JSON.
- `TextSnippet`: Pre-curated texts (Molière, programming snippets, quotes) indexed by language, category, and difficulty.

---

## 4. Query Performance & Indexing Guidelines

1. Always add `@@index` on foreign keys and frequently queried fields (`code`, `status`, `userId`, `raceId`).
2. Use `select` to retrieve only the fields needed by the client. Never select `passwordHash`.
3. In multi-player rooms with up to 100 participants, avoid heavy joins inside high-frequency polling loops.
