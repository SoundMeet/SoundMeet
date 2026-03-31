# Design System: SoundMeet

## 1. Overview

The SoundMeet design language is a high-contrast, dark-mode-first visual system. The core aesthetic is **"Glass-on-Onyx"** — deep dark surfaces with vibrant pink/red accent energy, glass floating elements, and glow-based depth instead of hard lines or shadows.

Key principles:

- **No-Line Rule:** No 1px solid borders for layout. Boundaries come from tonal surface shifts.
- **Glow over Shadow:** Depth is expressed through colored glows and backdrop blur, not drop shadows.
- **Intentional Asymmetry:** Elements can break the grid to feel curated, not generated.

---

## 2. Colors & Surface Logic

### Palette

| Token | Hex | Use |
| --- | --- | --- |
| `--color-dark` | `#141414` | Base canvas / body background |
| `--color-light` | `#ffffff` | Primary text |
| `--color-brand-red` | `#FB4040` | Accent Red (gradient endpoint, CTAs) |
| `--color-brand-yellow` | `#F7C10D` | Accent Yellow (warnings, status, sparkle only) |
| `--color-brand-magenta` | `#EB00D0` | Brand Magenta (reserved) |
| Primary Pink | `#DC2E73` | Interactive color, focus rings, active states |
| Surface Low | `#1C1B1B` | Large structural sections (sidebars, panels) |
| Surface High | `#2A2A2A` | Cards, inputs, interactive modules |
| Surface Bright | `#393939` | Hover states, active selections |
| On-Surface | `#E5E2E1` | Body text, subtle labels |

### No-Line Rule

Borders for layout are **prohibited**. Boundaries must be defined through:

- Background color shifts (`surface-high` against `dark` background)
- Tonal gradients

**Permitted exception — Ghost Glow:** Input focus and active states may use:

```css
box-shadow: 0 0 0 1px rgba(220, 46, 115, 0.5);
```

Always use `box-shadow`, never the `border` property — avoids layout shift.

**Ghost Border fallback** (accessibility only):

```css
box-shadow: 0 0 0 1px rgba(220, 46, 115, 0.15);
```

### Signature Gradients

- **Energy Gradient:** `#DC2E73` → `#FB4040` — primary CTAs, step indicators, played waveform
- **Vibe Gradient:** `#DC2E73` → `#F7C10D` — discovery, toggle backgrounds

### Glass Effect

Floating elements (modals, dropdowns, nav over rich content):

```css
background: rgba(20, 20, 20, 0.95);
backdrop-filter: blur(32px);
-webkit-backdrop-filter: blur(32px);
```

Cards using glass variant:

```css
background: rgba(20, 20, 20, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1); /* only glass cards */
```

### Text on Gradient / Image Backgrounds

Apply a bottom scrim for legibility:

```css
background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%);
```

Body text and metadata must sit in the lower 40% where the scrim is darkest. Headlines should have:

```css
text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);
```

### Yellow Usage

`#F7C10D` is reserved for warnings, status indicators, and "sparkle" moments. **Never more than 5% of screen real estate.**

---

## 3. Typography

One font family: **Sora**.

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap');

@theme {
  --font-sora: "Sora", sans-serif;
}

@layer base {
  body { font-family: var(--font-sora); }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-sora);
    font-weight: bold;
  }
}
```

### Type Scale

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Modal / Page title | 1.25rem (20px) | bold | |
| Section heading | 1rem (16px) | semibold | |
| Body | 0.875rem (14px) | regular | Standard content |
| Field label | 0.6875rem (11px) | medium | UPPERCASE, `letter-spacing: 0.1em` |
| Hint / meta | 0.625rem (10px) | medium | Secondary info |

---

## 4. Navigation

**Default:** Flat, full-width sticky bar.

- `position: sticky; top: 0`
- Background: transparent (inherits body `#141414`)
- Height: `h-16` (64px)
- Active page: animated underline in `#DC2E73` (`transition-all duration-300`)
- Inactive items: `rgba(229, 226, 225, 0.7)`
- Hover: `rgba(229, 226, 225, 1)` (full white)
- Logo: `LogoWithText.svg` on desktop → `LogoOnly.svg` on mobile
- Mobile: hamburger (`FaBars`) toggles dropdown

**Routes:**

```text
Discover  /
Meet      /meet
My Jams   /jams
Chat      /chat
Friends   /friends
```

**Floating Glass (page-specific only):** For pages where nav overlays rich visual content (map view):

```css
position: fixed;
inset: 1rem auto auto 1rem; /* + right */
border-radius: 9999px;
background: rgba(28, 27, 27, 0.6);
backdrop-filter: blur(24px);
```

---

## 5. Elevation & Depth

Depth comes from **tonal layering + colored glows**, not standard drop shadows.

### Layering

Stack surface tiers to create lift — no CSS borders needed:

```text
#141414 → #1C1B1B → #2A2A2A → #393939
(base)     (panels)   (cards)   (hover)
```

### Glow System

Components use colored glows appropriate to their context:

```css
/* Pink glow (primary interactive) */
box-shadow: 0 0 15px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.4);

/* Yellow glow (secondary/warning) */
box-shadow: 0 0 10px rgba(247, 193, 13, 0.8), 0 0 25px rgba(247, 193, 13, 0.5);

/* Red glow (destructive / accent) */
box-shadow: 0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.5);

/* Card ambient */
box-shadow: 0 0 25px rgba(255,255,255,0.08), 0 0 40px rgba(220,46,115,0.15);

/* Modal shadow */
box-shadow: 0 0 60px rgba(229,226,225,0.03), 0 0 50px rgba(220,46,115,0.1), 0 -1px 0 rgba(220,46,115,0.07);
```

Avoid high-opacity black shadows — keep them light, airy, and tinted.

---

## 6. Components

### Buttons

- **Primary (Energy Gradient):**

  ```css
  background: linear-gradient(to right, #DC2E73, #FB4040);
  border-radius: 9999px;
  color: white;
  font-weight: 600;
  ```

- **Glow (active toggle):**

  ```jsx
  className="px-4 py-1.5 rounded-full bg-pink-600 border-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.8),0_0_30px_rgba(236,72,153,0.4)]"
  ```

- **Inactive toggle:** `border-neutral-600 text-neutral-300 hover:border-pink-500`
- **Destructive:** Solid `#FB4040`, white text, `border-radius: 9999px`
- **Text-only:** `color: #DC2E73`, no background

### Inputs & Fields

All inputs use the `.jam-input` utility:

```css
.jam-input {
  width: 100%;
  background: #2A2A2A;
  border-radius: 0.75rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: #E5E2E1;
  outline: none;
  border: none;
  transition: box-shadow 0.2s ease;
  font-family: var(--font-sora), sans-serif;
  color-scheme: dark;
}

.jam-input::placeholder { color: rgba(229, 226, 225, 0.35); }
.jam-input:focus { box-shadow: 0 0 0 1px rgba(220, 46, 115, 0.5); }
```

- Search bars / pill inputs: `border-radius: 9999px`
- Standard form fields: `border-radius: 0.75rem`
- Hide number spinners and scrollbars on inputs

### Cards

- **Standard:** `background: #2A2A2A`, `border-radius: 1.5rem` (24px), no border
- **Glass card:** `bg-neutral-900/80 backdrop-blur-md border border-white/10`, `border-radius: 1.5rem`
- **Separation:** Use `gap: 2rem` (32px) between card groups — no dividers

### Chips / Selectors (`ChipSelector`)

```jsx
style={{
  borderRadius: shape === "pill" ? "9999px" : "0.625rem",
  background: active ? "rgba(220,46,115,0.18)" : "#2A2A2A",
  color: active ? "#DC2E73" : "rgba(229,226,225,0.5)",
  boxShadow: active ? "0 0 0 1px rgba(220,46,115,0.3)" : "none",
}}
```

Hover: `whileHover={{ scale: 1.04 }}` via Framer Motion.

### Toggle Switch (`GlowSwitch`)

Sizes: `sm` | `md` | `lg`

- Active: background `#DC2E73` + pink glow shadow
- Inactive: `rgba(255,255,255,0.2)`

### Modals (Radix UI Dialog + Framer Motion)

```css
background: rgba(20, 20, 20, 0.95);
backdrop-filter: blur(32px);
border-radius: 1.5rem; /* desktop */
border-radius: 1.5rem 1.5rem 0 0; /* mobile sheet */
max-width: 560px;
```

Overlay: `radial-gradient(ellipse at 50% 45%, rgba(220,46,115,0.08) 0%, rgba(0,0,0,0.74) 100%)`

Animation:

```js
initial={{ opacity: 0, y: 48 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
```

### Tags & Genre Pills (Profile)

```css
background: rgba(220, 46, 115, 0.2);  /* pink tags */
color: #DC2E73;
border: none;
border-radius: 9999px;
padding: 4px 14px;
font-size: 0.75rem;
text-transform: uppercase;
letter-spacing: 0.05em;
```

Neutral tags: `background: #2A2A2A`, `color: white`.

### Tooltips (`InfoTooltip`)

- Trigger: `w-4 h-4 rounded-full`, `background: rgba(220,46,115,0.15)`
- Popup: `#2A2A2A` background, `border-radius: 0.75rem`
- Shadow: `0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(220,46,115,0.1)`

### Online Status Indicators

- **Online:** `#22C55E` (10px green dot)
- **Away:** `#F7C10D` (yellow — use sparingly)
- **Offline:** No dot, or `rgba(229, 226, 225, 0.3)` gray

---

## 7. Utilities & Animations

### `.glow-pink`

```css
.glow-pink { box-shadow: none; transition: all 0.3s ease; }
.glow-pink:hover {
  box-shadow:
    0 0 8px rgba(236, 72, 153, 0.6),
    0 0 16px rgba(236, 72, 153, 0.4),
    0 0 24px rgba(236, 72, 153, 0.2);
  transform: scale(1.05);
}
```

### Keyframes

```css
@keyframes jamOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes shine {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```

### Libraries

- **Framer Motion** — modal transitions, chip hover, animated icons
- **Radix UI** — accessible dialog/modal primitives

---

## 8. Do's and Don'ts

### Do

- Use `box-shadow` for focus rings, never `border` — avoids layout shift
- Use tonal surface shifts (`#141414` → `#2A2A2A`) to define areas without lines
- Apply bottom scrims on any white text over gradient or image backgrounds
- Use colored glows (pink/red/yellow) to communicate interaction state
- Let images or album art break the grid slightly for a dynamic feel
- Use Framer Motion for meaningful transitions — not decoration

### Don't

- Don't use 1px solid borders for layout — only the Ghost Glow box-shadow is allowed
- Don't over-use yellow (`#F7C10D`) — it's for warnings and status only, max 5% screen
- Don't use high-opacity black drop shadows — keep them tinted and airy
- Don't use the Floating Glass nav by default — only on pages where nav overlays visual content
- Don't hardcode `#594046` as a border color — use `rgba(220, 46, 115, 0.15)` instead
