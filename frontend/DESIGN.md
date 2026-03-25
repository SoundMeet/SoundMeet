# Design System Strategy: The Sonic Editorial

## 1. Overview & Creative North Star
The "Sonic Editorial" is the creative North Star for this design system. It is a high-fidelity visual language designed to transition a music social platform from a utility to a cultural destination. Unlike standard "flat" social apps, this system treats the interface as a dynamic soundscape.

We break the "template" look through **Intentional Asymmetry** and **Tonal Depth**. By utilizing a high-contrast typography scale and overlapping floating elements, we create a layout that feels curated, not generated. The visual signature is defined by "chunky" organic radii and a "Glass-on-Onyx" layering principle that ensures the UI feels native to dark mode while remaining vibrantly expressive.

---

## 2. Colors & Surface Logic
The palette is rooted in a deep Onyx (`#141414`) background, allowing the high-chroma Primary Pink and Accent Red to pulsate like neon stage lights.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through:
- **Background Color Shifts:** Use `surface-container-low` against the `background` to define areas.
- **Tonal Transitions:** Using subtle gradients to separate headers from body content.

**Permitted Exception — Focus & Active States:** Input fields in focus state and primary CTA buttons may use a border expressed as `primary` (`#DC2E73`) at **40–60% opacity**, max 1px. This is the "Ghost Glow" — it signals interactivity without creating hard containment lines. This is the only context where a border is allowed; it must never be used at full opacity or for layout sectioning.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
- **Background (`#141414`):** The base canvas.
- **Surface-Container-Low (`#1C1B1B`):** Large structural sections (sidebars, panels).
- **Surface-Container-High (`#2A2A2A`):** Interactive cards or music player modules.
- **Surface-Bright (`#393939`):** Hover states and active selections.

### The "Glass & Gradient" Rule
To achieve a premium "Editorial" feel, floating elements (like player controls or navigation bars) must utilize **Glassmorphism**.
- **Token:** `surface-variant` at 60% opacity.
- **Effect:** Backdrop-blur (20px to 40px) to allow album art and background colors to bleed through, softening the layout's edges.

### Signature Textures
Main CTAs and Hero moments must utilize the **Signature Gradients**:
- **Energy Gradient:** `#DC2E73` (Primary Pink) → `#FB4040` (Accent Red). Use for high-action "Join," "Link to Jam," or "Edit Profile" buttons.
- **Vibe Gradient:** `#DC2E73` (Primary Pink) → `#F7C10D` (Accent Yellow). Use for discovery features and storytelling elements.

### Text on Gradient Backgrounds
When white text sits directly on a gradient card or image overlay (e.g., My Jams cards, album art headers), a **scrim** is required for legibility:
- Apply a `linear-gradient` from `rgba(0,0,0,0)` at the top to `rgba(0,0,0,0.65)` at the bottom of the card.
- Body text and metadata must sit in the lower 40% of the card where the scrim is darkest.
- Headlines may sit anywhere but must have `text-shadow: 0 1px 8px rgba(0,0,0,0.4)` applied.

---

## 3. Typography: Editorial Rhythm
The typography strategy pairs the brutalist, tight-kerning of **Coolvetica** with the hyper-legible, modern rhythm of **Inter**.

### Font Loading (Implementation)
```css
/* Load from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

/* Coolvetica must be self-hosted (not on Google Fonts) */
@font-face {
  font-family: 'Coolvetica';
  src: url('/fonts/coolvetica-rg.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

/* CSS Variables */
--font-display: 'Coolvetica', 'Arial Black', sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
```

### Type Scale
- **Display & Headlines (Coolvetica):** Set in Bold or Heavy weights. These are the "Lead Singers." Use `display-lg` (3.5rem / 56px) and `headline-lg` (2rem / 32px) to create an authoritative, magazine-style hierarchy. Letter-spacing: `-0.02em`.
- **Title & Body (Inter):** These are the "Backing Track." Clean, minimal, and highly legible. Body text stays strictly at `body-md` (0.875rem / 14px) to maintain a sophisticated white-space-to-content ratio. Line-height: `1.6`.
- **Labels (Inter):** Used for metadata (BPM, Genre, Time, Online status). High-contrast but small (`label-sm` / 0.75rem / 12px), uppercase with `0.05em` letter-spacing for a premium technical look.

---

## 4. Navigation
**Standard Implementation:** The navigation bar uses a flat, full-width pinned layout (`position: sticky; top: 0`) with `background: #141414` and no border. The active page is indicated by the nav label taking the `primary` color (`#DC2E73`); some pages use a small underline accent. This is the baseline pattern.

**Floating Glass (Enhanced):** For pages where the nav sits over rich visual content (e.g., Discover map view), the navbar should be upgraded to Floating UI:
- `position: fixed`, inset `spacing-4` (1rem) from the top edge.
- `border-radius: 9999px` (pill shape).
- `background: rgba(28, 27, 27, 0.6)`, `backdrop-filter: blur(24px)`.
- This is a page-specific enhancement, not the default.

---

## 5. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than traditional drop shadows.

### The Layering Principle
Stacking surface tiers creates a natural "lift." Place a `surface-container-lowest` card on a `surface-container-low` section to define its bounds without a single line of CSS border.

### Ambient Shadows
For floating UI components (Modals, Context Menus):
- **Blur:** 40px – 60px (Extra-diffused).
- **Opacity:** 4% – 8%.
- **Color:** Tinted shadow using `on-surface` (`#E5E2E1`) rather than pure black to mimic natural light dispersion.

### The "Ghost Border" Fallback
If accessibility requires a container border, use the **Ghost Border**:
- **Color:** `primary` (`#DC2E73`) at **15% opacity** — NOT the brownish `#594046` token, which has been deprecated.
- **Strict Prohibition:** Never use 100% opaque, high-contrast borders.

---

## 6. Components

### Buttons: The Action Drivers
- **Primary:** Gradient (`#DC2E73` to `#FB4040`), `border-radius: 3rem`, white text, `font-weight: 600`.
- **Secondary:** Glassmorphic (`surface-variant` @ 20% + blur), white text, Ghost Border at 15% opacity.
- **Tertiary:** Text-only in `primary` color (`#DC2E73`), no background.
- **Destructive/Warning:** Solid `#FB4040`, white text, same `3rem` radius.

### Cards: The Content Units
- **Style:** Chunky radius (`border-radius: 1.5rem`), no borders, `surface-container-high` (`#2A2A2A`) background.
- **Gradient Cards (My Jams style):** Full-bleed ambient color blobs (radial gradients in muted pinks/reds) as card background. Must include bottom scrim for text legibility (see Section 2). Minimum card height: `200px`.
- **Separation:** Forbid dividers. Use `gap: 2rem` (32px) between card groups.

### Inputs & Fields
- **Container:** `surface-container-highest` (`#2A2A2A`), `border-radius: 3rem` for search bars and message inputs; `border-radius: 0.75rem` for standard form fields.
- **Default State:** `border: none` — no visible border.
- **Focus State:** Transition to `box-shadow: 0 0 0 1px rgba(220, 46, 115, 0.5)` (Ghost Glow). Do not use `border` property for this — use `box-shadow` to avoid layout shift.
- **Placeholder text:** `color: rgba(229, 226, 225, 0.4)`.

### Audio / Waveform Player
This is a first-class component unique to this platform.
- **Container:** `surface-container-high` (`#2A2A2A`), `border-radius: 1.5rem`.
- **Waveform bars:** Inactive bars at `rgba(229, 226, 225, 0.3)`. Played portion uses the Energy Gradient (`#DC2E73` → `#FB4040`).
- **Play button:** Circle, white background, dark icon — `width: 40px`, `border-radius: 50%`.
- **Filename label:** `label-sm`, white, `font-weight: 500`.

### Genre Bubble / Onboarding Selector
Used on the onboarding genre-selection screen.
- **Bubble shape:** `border-radius: 50%`. Size varies by importance (selected = larger).
- **Default state:** `background: #FB4040` (Accent Red) at full opacity, white text.
- **Selected/loved state:** `background: #DC2E73` (Primary Pink), white text, scale up by ~15%.
- **Disliked state:** `opacity: 0.3`, grayscale filter.
- **Layout:** Organic packing — bubbles overlap slightly to create a clustered, non-grid feel. Use a physics-based or pre-calculated scattered layout.

### Navigation: Active State
- **Active nav item:** Text color shifts to `#DC2E73`. Optional: 2px underline in `#DC2E73` directly below the label.
- **Inactive nav item:** `rgba(229, 226, 225, 0.7)`.
- **Hover:** `rgba(229, 226, 225, 1)` (full white).

### Tags & Genre Pills (Profile)
- **Background:** `#DC2E73` at 20% opacity (or `surface-container-high` for neutral tags).
- **Text:** `#DC2E73` for pink tags; white for neutral tags.
- **Border:** none.
- **Radius:** `border-radius: 9999px`.
- **Size:** `padding: 4px 14px`, `font-size: 0.75rem`, uppercase, `letter-spacing: 0.05em`.

### Online Status Indicators
- **Online:** `#22C55E` (green dot, 10px circle).
- **Away:** `#F7C10D` (yellow, use sparingly — this is the tertiary yellow, acceptable here since it's sub-5% of screen real estate).
- **Offline:** No dot shown, or `rgba(229, 226, 225, 0.3)` gray.

---

## 7. Do's and Don'ts

### Do:
- **Use Intentional Asymmetry:** Let images or album art break the grid slightly to create a dynamic feel.
- **Embrace Large Spacing:** Use `spacing-12` (3rem) and `spacing-16` (4rem) to let content breathe.
- **Layer your Surfaces:** Think in 3D—what is closest to the user's eye? That should be your highest surface token.
- **Use scrims on gradient cards:** Any white text sitting on a gradient background needs a bottom scrim for legibility.
- **Use `box-shadow` for focus rings:** Never `border` — avoids layout shift and matches the Ghost Glow system.

### Don't:
- **Don't use 1px lines:** No dividers, no solid borders for layout. Use tone and space. The only exception is Ghost Glow focus states via `box-shadow`.
- **Don't over-use Yellow:** The `tertiary` yellow (`#F7C10D`) is for "sparkle," warnings, and status indicators only. It should never occupy more than 5% of the screen real estate.
- **Don't use standard shadows:** Avoid the "dirty" look of high-opacity black shadows. Keep them light, airy, and tinted.
- **Don't hardcode `#594046` as a border color** — this token has been removed. Use `rgba(220, 46, 115, 0.15)` instead.
- **Don't implement the Floating Glass nav by default** — only use it on pages where the nav overlays rich visual content (maps, hero images).
