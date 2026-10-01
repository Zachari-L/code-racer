---
name: race-engine-realtime
description: >-
  Use this skill when implementing or modifying typing mechanics, real-time telemetry,
  WPM/accuracy calculations, bot behavior, Mario Kart-style catch-up mechanics, or anti-cheat measures.
---

# CodeRacer Realtime Engine & Typing Specifications

This document outlines the core algorithms, gameplay mechanics, and state machine powering the CodeRacer competition engine.

---

## 1. Metrics & Calculation Formulas

### 1.1 Words Per Minute (WPM)
Standard international typing metric based on 5 keystrokes per word:
$$\text{WPM} = \frac{\text{Correct Characters} / 5}{\text{Time Elapsed in Seconds} / 60}$$

Implementation (`src/lib/utils.ts`):
```typescript
export function calculateWpm(correctChars: number, timeElapsedSec: number): number {
  if (timeElapsedSec <= 0) return 0;
  const words = correctChars / 5;
  const minutes = timeElapsedSec / 60;
  return Math.round((words / minutes) * 10) / 10;
}
```

### 1.2 Accuracy Percentage
$$\text{Accuracy} = \frac{\text{Correct Characters}}{\text{Total Characters Typed}} \times 100$$

Implementation (`src/lib/utils.ts`):
```typescript
export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correctChars / totalChars) * 1000) / 10));
}
```

---

## 2. Typing Modes

- **Strict Mode (`strictMode: true`):**
  - If the player types an incorrect character, the caret does not advance until the error is corrected via backspace.
  - Required for programming syntax and precise training.
- **Permissive Mode (`strictMode: false`):**
  - Errors are highlighted in red, but the caret continues advancing.
  - Final WPM is penalized based on total error count.

---

## 3. Anti-Cheat & Security

1. **Disable Paste Event:**
   In typing input arenas, always intercept and cancel paste actions:
   ```tsx
   <input
     onPaste={(e) => {
       e.preventDefault();
       return false;
     }}
   />
   ```
2. **Telemetry Validation:**
   - Flag or reject submissions where keystroke intervals are mathematically superhuman (< 30ms consistently).
   - Timestamp verification prevents clock tampering.

---

## 4. Bot Simulation Architecture

Bots simulate real human racers with natural speed variance:
- **Easy:** 25–35 WPM, 90% accuracy, periodic pauses.
- **Medium:** 50–65 WPM, 95% accuracy.
- **Hard:** 85–100 WPM, 98% accuracy.
- **Impossible:** 130–150 WPM, 99.5% accuracy.

### Bot Keystroke Loop:
```typescript
const intervalMs = (60 * 1000) / (targetWpm * 5);
const jitter = (Math.random() - 0.5) * 40; // Natural human variation
```

---

## 5. Catch-up Mechanics (Mario Kart Bonus)

To keep younger students engaged when trailing far behind:
- If a player is > 30% behind the leader, subtle catch-up mechanics activate (e.g. slight forgiveness window on minor punctuation errors or dynamic speed slipstream visual).
