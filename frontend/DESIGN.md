# Design System Strategy: 

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

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
- **Background (`#131313`):** The base canvas.
- **Surface-Container-Low (`#1C1B1B`):** Large structural sections.
- **Surface-Container-High (`#2A2A2A`):** Interactive cards or music player modules.
- **Surface-Bright (`#393939`):** Hover states and active selections.

### The "Glass & Gradient" Rule
To achieve a premium "Editorial" feel, floating elements (like player controls or navigation bars) must utilize **Glassmorphism**.
- **Token:** `surface-variant` at 60% opacity.
- **Effect:** Backdrop-blur (20px to 40px) to allow album art and background colors to bleed through, softening the layout’s edges.

### Signature Textures
Main CTAs and Hero moments must utilize the **Signature Gradients**:
- **Energy Gradient:** `#DC2E73` (Primary Pink) → `#FB4040` (Accent Red). Use for high-action "Join" or "Go Live" buttons.
- **Vibe Gradient:** `#DC2E73` (Primary Pink) → `#F7C10D` (Accent Yellow). Use for discovery features and storytelling elements.

---

## 3. Typography: Editorial Rhythm
The typography strategy pairs the brutalist, tight-kerning of **Coolvetica** with the hyper-legible, modern rhythm of **Inter/Poppins**.

- **Display & Headlines (Coolvetica):** Set in Bold or Heavy weights. These are the "Lead Singers." Use `display-lg` (3.5rem) and `headline-lg` (2rem) to create an authoritative, magazine-style hierarchy.
- **Title & Body (Inter/Poppins):** These are the "Backing Track." Clean, minimal, and highly legible. Body text stays strictly at `body-md` (0.875rem) to maintain a sophisticated white-space-to-content ratio.
- **Labels (Inter):** Used for metadata (BPM, Genre, Time). High-contrast but small (`label-sm`), often uppercase with 0.05em letter spacing for a premium technical look.

---

## 4. Elevation & Depth
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
- **Token:** `outline-variant` (`#594046`) at 15% opacity.
- **Strict Prohibition:** Never use 100% opaque, high-contrast borders.

---

## 5. Components

### Buttons: The Action Drivers
- **Primary:** Gradient (`#DC2E73` to `#FB4040`), `xl` roundedness (3rem), white text.
- **Secondary:** Glassmorphic (`surface-variant` @ 20% + blur), white text.
- **Tertiary:** Text-only in `primary-fixed`, no background.

### Cards: The Content Units
- **Style:** Chunky radius (`lg` 2rem), no borders, `surface-container-high` background.
- **Separation:** Forbid dividers. Use `spacing-8` (2rem) of vertical white space to separate card groups.

### Inputs & Fields
- **Container:** `surface-container-highest` with a `none` border.
- **Focus State:** Transition to a 1px "Ghost Border" using `primary` at 40% opacity.

### Navigation: Floating Glass
Bottom bars and Top headers should not be "pinned" to the edge. They should be "Floating UI" elements with `full` roundedness and heavy glassmorphism, sitting `spacing-4` away from the screen edge.

---

## 6. Do’s and Don’ts

### Do:
- **Use Intentional Asymmetry:** Let images or album art break the grid slightly to create a dynamic feel.
- **Embrace Large Spacing:** Use `spacing-12` (3rem) and `spacing-16` (4rem) to let content breathe.
- **Layer your Surfaces:** Think in 3D—what is closest to the user's eye? That should be your highest surface token.

### Don’t:
- **Don't use 1px lines:** No dividers, no solid borders. Use tone and space.
- **Don't over-use Yellow:** The `tertiary` yellow (`#F7C10D`) is for "sparkle" and warnings only. It should never occupy more than 5% of the screen real estate.
- **Don't use standard shadows:** Avoid the "dirty" look of high-opacity black shadows. Keep them light, airy, and tinted.