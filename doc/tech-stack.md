# Tech Stack Architecture

A minimal, production-ready specification for a full-stack Next.js web application.

---

## 1. Core Framework & Runtime

* **Framework:** Next.js (App Router, Server Components & Server Actions)
* **Language:** TypeScript (strict mode)
* **Package Manager & Dev Tooling:** Bun (`bun install`, scripts, and testing)
* **Formatting & Linting:** Prettier + ESLint

---

## 2. Frontend & UI

* **Styling Engine:** Tailwind CSS
* **Component Primitives:** shadcn/ui (Radix UI primitives)
* **Icons:** Lucide React
* **Form Handling:** React Hook Form
* **Form & Schema Validation:** Zod

---

## 3. Backend & Data Layer

* **Database:** PostgreSQL (Fly.io Postgres or managed provider)
* **ORM:** Prisma (schema modeling, migrations, type-safe client)
* **Validation:** Zod (shared schemas for client forms & server actions)

---

## 4. Authentication

* **Auth Framework:** Auth.js (NextAuth v5) or Better Auth
  * **OAuth:** GitHub, Google, or custom OAuth providers
  * **Credentials:** Username & Password strategy (no email required)
* **Password Hashing:** `argon2` or `bcryptjs`

---

## 5. Deployment & Infrastructure

* **Host:** Fly.io
* **Containerization:** Multi-stage Dockerfile (`node:alpine` or `oven/bun` runner with Next.js `output: "standalone"`)
* **Database Connection:** Fly.io internal wireguard private network (`DATABASE_URL`)
