# Laguntza Fisioterapia — Design System

A brand & UI design system for **Laguntza Fisioterapia**, a physiotherapy and
osteopathy clinic in **Urnieta, Gipuzkoa** (Basque Country, Spain). The clinic
is run by **Jokin Ramos**, a licensed physiotherapist, and offers manual
therapy, osteopathy, rehabilitation, therapeutic exercise, dry needling and
neuromodulation. The brand is warm, personal and local: a single trusted
professional, close to home, treating each person individually.

The product surface is a **bilingual marketing website** (Basque `eu` +
Spanish `es`) built with Astro. There is one product here — the website — so the
design system centres on that. Its signature is a cinematic, dark, image-led
landing experience that scrolls into a clean editorial content section, all
anchored by a teal-and-warm-orange palette and a hand-painted brushstroke mark.

> **Live site:** https://www.laguntzafisioterapia.com
> **Clinic:** Zubitxo Plaza, 3, 20130 Urnieta, Gipuzkoa · 943 036 070

---

## Sources

This system was reverse-engineered from the production codebase. If you have
access, read these to go deeper — the real components carry detail this summary
can't:

- **Main website repo (Astro):** https://github.com/jramosg/laguntza-fisioterapia
  - `src/styles/theme.css` — the full token set (lifted into `colors_and_type.css`)
  - `src/styles/typography.css` — the fluid type scale
  - `src/config/company.ts` — services, address, phone, contact data
  - `src/i18n/ui.ts` — all copy, in Basque and Spanish
  - `src/components/` — Header, Footer, ContactForm, hero & section components
  - `src/images/logos/` — the brand logo lockups
- **Companion app repo (not used here):** https://github.com/jramosg/laguntza-fisioterapia-app

Exploring these repositories directly will let you build with higher fidelity
than this distilled system alone.

---

## Content Fundamentals

**Languages.** Everything ships in **Basque (eu)** first and **Spanish (es)**
second — Basque is the default locale. Copy is never English-facing. When you
write new copy, write it in both languages, Basque-first.

**Voice — warm, personal, first-person.** The clinic speaks as *Jokin*, one
person, not a faceless company. Copy uses **"I" / "we"** and addresses the
reader as **"you" (tú / zu)**, informal, never the formal *usted*.
- ES: *"Soy Jokin Ramos, fisioterapeuta de Urnieta… me animé a dar el paso y abrir Laguntza Fisioterapia en mi pueblo."*
- ES: *"Cada paciente es único. Realizo una valoración completa para diseñar el tratamiento específico que necesitas."*
- EU: *"Ni Jokin Ramos naiz, urnietako fisioterapeuta."*

**Tone.** Reassuring, competent, plain-spoken. It pairs clinical precision
("valoración y diagnóstico funcional", "neuromodulación percutánea") with human
warmth ("tu centro de fisioterapia de confianza", "te responderemos lo antes
posible"). No hype, no exclamation-spam, no marketing buzzwords.

**Casing.** Headings and section titles use **Title Case** in Spanish for
service names ("Terapia Manual", "Ejercicio Terapéutico y Prevención") and
sentence case for narrative copy. Eyebrow labels are **UPPERCASE** with wide
letter-spacing. Buttons are sentence case ("Pedir cita", "Enviar mensaje").

**Place is part of the brand.** Copy constantly names the territory — Urnieta,
Gipuzkoa/Guipúzcoa, near Donostia, Hernani, Andoain. Locality = trust. Keep it.

**No emoji** anywhere in product copy or UI. (The GitHub README uses them; the
website does not.) Icons do that job instead.

**CTAs.** The recurring primary action is **"Pedir cita" / "Hitzordua hartu"**
(book an appointment). Secondary CTA on services: **"Contactar" / "Kontaktatu"**.

---

## Visual Foundations

**Palette.** Two brand colours do all the work:
- **Primary — teal `#458295`**, a calm clinical blue-green. Full 100–900 ramp.
  Used for trust, links, primary buttons, focus rings, headings-on-dark.
- **Secondary — warm orange `#e8944a`**. The accent and warmth. Used for the
  main CTA, eyebrow labels, and a handful of "warm" tags. Roughly a 1:4 ratio
  to teal — it punctuates, it doesn't dominate.
- Neutrals: white background, `#f2f2f2` grey surface, near-black `#0a0e10` for
  the editorial dark sections, plus a full Figma grey ramp (`--grey-50…900`).

**Gradients.** Exactly **one** brand gradient: a 135° teal diagonal
(`#458295 → #56a4bd → #3d6f7f`). Used sparingly on the submit button and a few
container fills. There are **no purple/blue AI-slop gradients** — avoid them.

**Typography.** A single family — **Inter** (shipped as Inter Variable). All
headings are Inter **700** with tight `-0.02em` tracking and 1.1 line-height;
`h3` drops to **500**. Body is **400** at 18–20px, line-height 1.5. The type
scale is **fluid** (`clamp()`), from `sm` 15px to `xxxl` ~84px. No serif, no
secondary display face.

**Imagery.** Real, warm photography of the therapist and treatments
(`jokin.webp`, `prevention.webp`, `puncture.webp`). On the homepage a full-bleed
hero photo sits behind the logo as a mask. Service images are shown as square
cards with a **dark diagonal gradient overlay** (`rgba(0,0,0,.45→.65)`) and a
white title laid over them. Images are warm-toned, not B&W, not heavily filtered.

**Backgrounds & texture.** Two modes: clean **white** for standard pages, and a
near-black **editorial dark** (`#0a0e10`) for the homepage content stream. The
dark sections carry a *very* subtle SVG **fractal-noise grain** (opacity ~0.03)
for organic warmth, plus soft radial colour glows behind key elements.

**Shape & radius.** Generously rounded. Cards and images use
`--shape-radius: clamp(1rem, 2rem, 3rem)`; buttons are fully **pill-shaped**
(`--button-radius: 3rem`). Tags are 100px pills. Nothing is sharp-cornered.

**Cards.** Three variants: **elevated** (white, `shadow-md`, lifts +
`scale(1.02)` and brightens on hover), **outlined** (1px outline, border turns
teal + surface fills on hover), and **flat** (grey surface). Dark "bento" cards
use translucent white fills (`rgba(255,255,255,.02)`) with hairline borders.

**Elevation.** A Tailwind-style shadow ramp `sm → 2xl`. Resting cards sit at
`shadow-md`; hover lifts to `shadow-2xl`.

**Motion.** Calm and physical. The signature easing is
`cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for reveals, links and hovers.
Scroll-reveal sections fade up 32px over ~0.9s. The homepage uses **GSAP +
ScrollTrigger** for a scrubbed hero→services cinematic sequence. Links grow
their gap and nudge an arrow on hover. A gentle `bounce-pulse` loop sits on the
"keep scrolling" cue. Respect `prefers-reduced-motion`.

**Hover / press states.** Buttons darken (primary `700 → 800`) or lift
`translateY(-2px)` with a deeper shadow; CTA presses back to `translateY(0)`.
Links shift opacity `.72 → 1`. Tags lift `-3px` and gain a soft coloured shadow.

**Focus / accessibility.** WCAG-minded: a visible 2px teal focus outline with
2px offset, a 4px teal glow on buttons, and a hard **44px minimum touch target**
on all interactive elements.

**Transparency & blur.** The fixed header gains a `blur(10px)` + slight opacity
on scroll. Dark-section cards use low-alpha white fills. Blur is used for depth,
not decoration.

**Layout.** Centred containers: `--container-max 1440px`, narrow variant 960px.
A fixed top header (5.8rem) that hides on scroll-down / shows on scroll-up. A
13-step spacing scale (`--s … --s13`, 4px → 384px).

---

## Iconography

The site uses **line icons**, not filled, at a medium stroke weight, monochrome
and inheriting `currentColor`. Two sources:

1. **Local SVG icons** (`src/icons/`, copied into `assets/icons/`): `marker`,
   `phone`, `email`, `send`, `check`, `circle-check`, `chevron-right`,
   `translate`, `keep-scrolling`, `github`. These are small, hand-picked,
   `currentColor`-driven, and used inline (address marker, phone, form send,
   language toggle, scroll cue).
2. **Iconify** via `astro-icon` — the **`mdi`** (Material Design Icons) and
   **`ic`** sets. Used mainly for social links in the footer: `mdi:instagram`,
   `mdi:whatsapp`, `mdi:email-outline`, `mdi:linkedin`.

To match this system: use the included SVGs first; otherwise pull from
**Material Design Icons (mdi)** via Iconify for parity — same line style, same
`currentColor` behaviour. If you need a CDN substitute, **Lucide** is the closest
match in weight and feel; flag any substitution. **No emoji**, no multicolour
icons, no unicode glyphs as icons.

> **Note — font substitution:** Inter is loaded here from Google Fonts. It is
> the *same* family the production site ships (`@fontsource-variable/inter`), so
> this is a faithful match, not an approximation. If you want the exact variable
> font files bundled, ask and I'll add them to `fonts/`.

---

## Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — brand context, content & visual foundations, iconography |
| `colors_and_type.css` | **Start here.** All design tokens: colours, type scale, spacing, shadows, motion. Semantic + foundational CSS vars. |
| `SKILL.md` | Agent-Skill manifest, for use in Claude Code |
| `assets/logos/` | Logo lockups — horizontal/vertical, main (dark) / white / fondo (teal-bg), plus the isotipo mark |
| `assets/icons/` | Local line-icon SVG set |
| `assets/images/` | Real brand photography (therapist, treatments) |
| `preview/` | The Design System tab cards (`card.css` + one HTML file per token group) |
| `ui_kits/website/` | High-fidelity, interactive recreation of the marketing website — see its own README |

### UI kits
- **`ui_kits/website/`** — the Laguntza Fisioterapia marketing site: hero,
  editorial homepage content (intro, about-Jokin, services, specialty tags,
  bento "why", CTA), services page, and contact form. Built from the real Astro
  components.

---

*Built from the production codebase at github.com/jramosg/laguntza-fisioterapia.
Explore that repo to design with even higher fidelity.*
