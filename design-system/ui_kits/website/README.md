# Website UI Kit — Laguntza Fisioterapia

A high-fidelity, interactive recreation of the **Laguntza Fisioterapia**
marketing website, rebuilt from the production Astro source
(github.com/jramosg/laguntza-fisioterapia). Open `index.html`.

## What it covers

- **Home** — the signature experience:
  - **Hero**: full-bleed clinic photo, white brand lockup, bilingual H1,
    address chip, warm CTA, animated scroll cue.
  - **Editorial dark content stream** (`#0a0e10` + grain): a pull-quote intro,
    a magazine-style *"Conoce a tu fisioterapeuta"* spread, a split services
    overview with gradient heading, flowing specialty tags, a bento "why
    choose us" grid, and a warm gradient CTA card. Sections fade up on scroll.
- **Services** — grid of image cards with dark diagonal overlays and titles.
- **Contact** — the full contact form: labelled pill inputs with inline icons,
  focus rings, required markers, and an animated success state on submit.
- **Header** — sticky nav, logo (swaps to white over the hero), language
  toggle (ES ⇄ EU, live), and the persistent "Pedir cita" CTA.
- **Footer** — socials, phone/address, quick links, vertical logo, copyright.

## Bilingual

Toggle **ES / EU** in the header — all copy switches between Spanish and
Basque live. Copy is lifted from `src/i18n/ui.ts`.

## Files

| File | Role |
|---|---|
| `index.html` | App shell — loads React + Babel, mounts the views, handles view/lang state |
| `app.css` | Kit styles (imports `../../colors_and_type.css` for tokens) |
| `content.jsx` | All copy (ES + EU) + company data → `window.L`, `window.COMPANY` |
| `Chrome.jsx` | `Header`, `Footer` |
| `Home.jsx` | `Hero`, `Reveal`, `HomeContent` (the dark editorial stream) |
| `Pages.jsx` | `ServicesPage`, `ContactPage` |

## Notes

- These are cosmetic recreations: the form doesn't POST anywhere, nav is
  client-side view-switching, and the homepage's GSAP scroll-scrub choreography
  is simplified to a clean static hero + scroll-reveal content.
- Assets are referenced from the design-system `assets/` folder via `../../assets`.
