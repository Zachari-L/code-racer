---
name: testing-and-qa
description: >-
  Use this skill when adding new tests, debugging regressions, verifying builds,
  or running quality assurance audits (typecheck, lint, formatting, test suite) on CodeRacer.
---

# CodeRacer Testing & Quality Assurance Runbook

This guide covers testing practices, linting, type-checking, and CI quality gates for CodeRacer.

---

## 1. Quick Quality Check Workflow

Before submitting changes or completing a task, always run the full suite:

```bash
# 1. Typecheck TypeScript strictly
bun run typecheck

# 2. Run unit tests
bun test

# 3. Lint the codebase
bun run lint

# 4. Check code formatting
bun run format:check

# 5. Verify production Next.js build
bun run build
```

---

## 2. Unit & Integration Testing with Bun

Unit tests reside in the `tests/` directory and use Bun's built-in fast test runner (`bun:test`).

### Writing a Test:
```typescript
import { describe, expect, it } from "bun:test";
import { calculateWpm, calculateAccuracy } from "@/lib/utils";

describe("My Module", () => {
  it("computes correctly", () => {
    expect(calculateWpm(250, 60)).toBe(50);
  });
});
```

---

## 3. Key Areas Requiring Test Coverage

1. **Typing Engine Calculations:** WPM, raw WPM, accuracy %, penalty calculations in strict vs permissive modes.
2. **Access Control & Lobbies:** Validating 6-digit codes, 100-player capacity limits, role assignment (Host, Participant, Spectator).
3. **Form Validations:** Zod schema edge cases (usernames, nicknames, lobby settings).
4. **Anti-Cheat:** Ensuring paste prevention handlers and payload telemetry limits reject anomalies.

---

## 4. Docker Build Verification

To verify that standalone containerization builds cleanly for Fly.io:
```bash
docker build -t coderacer:local .
```
Ensure all external modules are configured in `next.config.ts` (`serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcryptjs"]`).
