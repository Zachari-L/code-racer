---
name: code-conventions
description: >-
  Use this skill when developing new features, creating components, writing server actions,
  or refactoring existing code in the CodeRacer project. Enforces Next.js App Router patterns,
  TypeScript strict conventions, Zod validation, and error handling.
---

# CodeRacer Code Conventions & Development Patterns

This runbook guides agents and engineers on writing compliant, robust, and idiomatic code for the CodeRacer platform.

---

## 1. Component Architecture & Boundaries

### 1.1 Server Components (Default)
Keep components as React Server Components unless interactivity is required.
- Place in `src/components/` or route segments.
- Fetch database records directly using `prisma` from `@/lib/prisma`.
- Do not import hooks (`useState`, `useEffect`, `useRouter`).

### 1.2 Client Components (`"use client"`)
Declare `"use client"` at the top of files that:
- Handle user keystrokes, typing arena input, or timers.
- Manage local UI state (`useState`, `useReducer`, `useRef`).
- Connect to WebSockets / SSE / real-time telemetry streams.
- Utilize browser APIs (audio playback, clipboard, window events).

---

## 2. Server Actions Pattern

All state mutations and API transactions must follow the Server Action pattern:

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function myAction(input: InputType): Promise<{
  success: boolean;
  data?: OutputType;
  error?: string;
}> {
  // 1. Validate payload with Zod
  const validation = mySchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid request",
    };
  }

  // 2. Perform database or business transaction safely
  try {
    const result = await prisma.myModel.create({ data: validation.data });
    return { success: true, data: result };
  } catch (error) {
    console.error("Action error:", error);
    return { success: false, error: "Operation failed. Please try again." };
  }
}
```

---

## 3. TypeScript Standards

1. **Strict Mode:** `tsconfig.json` has `strict: true`. Never use `any`; use `unknown`, type narrowing, or generics.
2. **Centralized Types:**
   - Domain types: `src/types/race.ts`, `src/types/auth.ts`, `src/types/user.ts`.
   - Zod-inferred types: `z.infer<typeof mySchema>`.
3. **Null Safety:** Avoid non-null assertion operator `!` unless guaranteed by preceding logic.

---

## 4. Form Handling

- Combine **React Hook Form** with **Zod** resolvers:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mySchema, type MyInput } from "@/lib/validations/mySchema";

const form = useForm<MyInput>({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
});
```

---

## 5. Security & Minor Protection
- **Anonymity:** CodeRacer is designed for students aged 12–17. Never log or render identifiable student emails or personal names in public race feeds or leaderboards.
- **Anti-Paste:** Block paste events on typing inputs: `onPaste={(e) => e.preventDefault()}`.
