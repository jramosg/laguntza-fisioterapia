---
name: laguntza-fisioterapia-design
description: Use this skill to generate well-branded interfaces and assets for Laguntza Fisioterapia (a physiotherapy & osteopathy clinic in Urnieta, Gipuzkoa), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `README.md` — brand context, content & visual foundations, iconography. **Read first.**
- `colors_and_type.css` — all design tokens (colours, Inter type scale, spacing, shadows, motion). Import it and use the CSS vars.
- `fonts/` — the self-hosted Inter variable fonts wired into `colors_and_type.css`.
- `assets/logos/` — logo lockups (main / white / fondo, horizontal & vertical) + the isotipo brushstroke mark.
- `assets/icons/` — local line-icon SVG set.
- `assets/images/` — real brand photography.
- `preview/` — design-system token cards.
- `ui_kits/website/` — interactive recreation of the marketing site; lift components and patterns from here.

## House rules (do not violate)
- Bilingual brand: write copy in **Basque (eu)** and **Spanish (es)**, Basque-first. Never English-facing product copy.
- Voice: warm, first-person ("Soy Jokin…"), informal "you" (tú/zu). Name the territory (Urnieta, Gipuzkoa).
- Palette: teal `#458295` primary, warm orange `#e8944a` accent (~1:4). One teal gradient only. **No purple/AI-slop gradients. No emoji.**
- Type: **Inter** only — headings 700 / tight tracking, body 400. Fluid `clamp()` scale.
- Shape: generous radii, pill buttons, rounded cards. Two surface modes: clean white, and editorial near-black `#0a0e10` with subtle grain.
- Motion: calm `cubic-bezier(.16,1,.3,1)`, fade-up reveals; respect `prefers-reduced-motion`.
- Icons: use the included SVGs, else Material Design Icons (mdi) via Iconify; Lucide as a CDN substitute. Never hand-draw icons.
