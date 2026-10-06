---
name: artistic-direction-styling
description: >-
  Use this skill when designing, building, or modifying UI components, pages, layouts,
  or visual effects in CodeRacer. Enforces the "Vibrant Classroom Arcade" aesthetic,
  color palette, tactile button styling, typography, and responsive behavior.
---

# CodeRacer Artistic Direction & Styling Guidelines

This guide details how to build user interfaces strictly aligned with the **"Vibrant Classroom Arcade"** design specification (`doc/artistic-direction.md`).

---

## 1. Aesthetic Foundations

The design balances structured educational clarity with exhilarating multiplayer excitement:
- **Canvas:** Muted light theme reducing eye strain in brightly lit classrooms.
- **Vibe:** Chunky, tactile, punchy, game-like arcade with dopamine-inducing accents.

---

## 2. Color Palette & Rules of Use

| Role | Color Name | Hex Code | Tailwind / Class Token | Usage Restriction |
|---|---|---|---|---|
| **Canvas Base** | Off-White | `#f4f4ed` | `bg-canvas` / `var(--background)` | Main application background. Keeps text readable. |
| **Primary Text** | Dark Slate | `#111112` | `text-slate-dark` | Text editor, titles, primary content. |
| **Primary CTA** | Electric Lime | `#d2ff00` | `bg-electric-lime` / `btn-lime` | **STRICTLY RESERVED** for hero action ("REJOINDRE LA COURSE", "DÉMARRER") and the player's personal race progress bar. |
| **Player 1** | Azure Blue | `#007BFF` | `text-azure-blue` / `border-azure-blue` | Player 1 car, WPM badge, input focus borders. |
| **Player 2** | Tangerine Orange | `#FF7A00` | `text-tangerine-orange` / `bg-tangerine-orange` | Player 2 car, progress track line. |
| **Player 3** | Arcade Magenta | `#D9008D` | `text-arcade-magenta` / `bg-arcade-magenta` | Player 3 car, secondary accents, error callouts. |
| **Player 4** | Victory Teal | `#00BFA5` | `text-victory-teal` / `bg-victory-teal` | Player 4 car, success highlights. |

---

## 3. Typography: Curvy Meets Code

1. **UI & Menus (Sans-Serif): `Nunito`**
   - Rounded, bold geometric letterforms.
   - Use `font-sans` with `font-extrabold` or `font-black` for headers and buttons.
   - Youthful and energetic without being childish.

2. **Typing Arena & Telemetry (Monospace): `JetBrains Mono`**
   - High-clarity monospace coding font.
   - Use `font-mono` inside the typing arena and lobby 6-digit code display.
   - Ensures distinct glyphs for `0` vs `O`, `1` vs `l`, and punctuation.

---

## 4. Tactile Arcade Shape Language

1. **Chunky Borders:**
   - Elements feature heavy borders: `border-3 border-slate-dark`.
2. **Arcade Shadows:**
   - Drop shadows create a retro mechanical feel:
   ```css
   box-shadow: 0 4px 0 #111112;
   ```
   - On `:active`, compress by 2px with `translate-y-[2px]` and `box-shadow: 0 1px 0 #111112`.
3. **Pill & Rounded Shapes:**
   - Buttons: `rounded-full`.
   - Cards & Modals: `rounded-3xl`.
   - Tags & Badges: `rounded-full border-2 border-slate-dark`.

---

## 5. Track & Car Visuals

- Each participant is assigned one of the 4 competitor colors (`azure`, `tangerine`, `magenta`, `teal`).
- All feedback for that player (their track lane, their car, their live WPM pill, their leaderboard card) **must match their assigned color**.
- Cars are smooth, chunky, toy-like low-poly 3D models or 2D SVG arcade sprites.

---

## 6. Interaction & Hover Rules

- **Unclickable Elements Remain Static:** Unclickable cards, containers, previews, and feature badges **must never** have hover animations, 3D tilts, or cursor sheen glares.
- **Clickable Exclusivity:** ONLY clickable elements (buttons, links, active inputs) may lift, scale, or expand shadow on hover (`button.arcade-shadow:hover`, `a.arcade-shadow:hover`).
- **Ambient Backgrounds:** Background animations (speed lines, ambient confetti) must remain ambient and gentle, and must never track mouse movement or distract from typing focus.
