# Laguntza Fisioterapia Astro Website

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Website for [Laguntza Fisioterapia](https://www.laguntzafisioterapia.com),
a physiotherapy and osteopathy clinic in Urnieta, Gipuzkoa. The project uses
Astro, TypeScript, multilingual routing, structured data, Cloudinary images,
Leaflet maps, and Docker-based deployment.

Use this repository as a working example for:

- Astro clinic website development
- multilingual Astro sites in Basque and Spanish
- SEO for healthcare, physiotherapy, and local business websites
- static site deployment with Docker, Nginx, and GitHub Actions
- small business websites with contact forms, maps, and schema markup

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [SEO Notes](#seo-notes)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- Astro 5 static site with file-based routing
- Basque (`eu`) and Spanish (`es`) pages under `src/pages/[lang]/`
- shared company, navigation, footer, FAQ, and settings files in `src/config/`
- reusable Astro components for layout, services, forms, maps, and sections
- Open Graph, FAQ schema, service schema, and structured business data
- responsive CSS theme built with custom properties
- Leaflet map integration for the clinic location
- WhatsApp floating action button
- Cloudinary image support and local optimized images
- Prettier formatting with Astro plugin
- GitHub Actions format checks
- Docker build and server deployment workflow

## Tech Stack

- [Astro](https://astro.build/) 5
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/)
- [Leaflet](https://leafletjs.com/)
- [GSAP](https://greensock.com/gsap/)
- [Cloudinary](https://cloudinary.com/)
- [Prettier](https://prettier.io/)
- [Docker](https://www.docker.com/)
- [Nginx](https://nginx.org/)

## Requirements

- Node.js from `.nvmrc`
- pnpm 8 or newer
- Git

```bash
nvm use
pnpm install
```

## Local Development

Start Astro:

```bash
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321).

Useful commands:

| Command | Action |
| --- | --- |
| `pnpm dev` | Start the Astro dev server |
| `pnpm build` | Build the static site into `dist/` |
| `pnpm preview` | Preview the production build |
| `pnpm format` | Format files with Prettier |
| `pnpm format:check` | Check formatting in CI |
| `pnpm astro ...` | Run Astro CLI commands |

## Project Structure

```text
laguntza-fisioterapia/
|-- .github/workflows/       # format check and server deployment
|-- nginx/                   # production Nginx config
|-- public/                  # static files copied by Astro
|-- src/
|   |-- components/          # Astro UI components
|   |-- config/              # site, company, nav, footer, FAQ settings
|   |-- i18n/                # translation strings and helpers
|   |-- images/              # local image assets
|   |-- layouts/             # base page and post layouts
|   |-- pages/               # Astro routes
|   |-- styles/              # global CSS and theme tokens
|   `-- utils/               # helper functions
|-- astro.config.mjs
|-- Dockerfile
|-- package.json
`-- README.md
```

Key files:

- `src/config/company.ts` stores clinic contact, address, and business data.
- `src/config/nav.ts` defines navigation for each language.
- `src/i18n/ui.ts` stores translated UI strings.
- `src/components/head/` contains SEO and structured data components.
- `src/components/forms/ContactForm.astro` contains the contact form UI.
- `src/components/LeafletMap.astro` renders the location map.

## Configuration

Update clinic details in `src/config/company.ts`.

Update routes and menu labels in `src/config/nav.ts`.

Update translations in `src/i18n/ui.ts`.

Update global theme values in `src/styles/theme.css`.

Add or edit localized pages in `src/pages/[lang]/`.

## SEO Notes

The site targets local searches for Laguntza Fisioterapia, physiotherapy in
Urnieta, osteopathy in Gipuzkoa, sports injury recovery, therapeutic exercise,
dry needling, and rehabilitation services in Basque and Spanish.

The codebase includes:

- localized URLs for Basque and Spanish content
- page metadata through shared head components
- Open Graph data for social sharing
- FAQ schema for service pages
- service schema for treatment pages
- clinic address and contact data in a central config file
- `robots.txt`, web manifest, favicons, and sitemap support

For GitHub discovery, keep these phrases in the repository description or
topics where they fit: `astro`, `astro-website`, `typescript`,
`physiotherapy`, `clinic-website`, `healthcare-website`, `multilingual`,
`i18n`, `seo`, `basque`, `spanish`, `static-site`, `docker`, `nginx`.

## Deployment

Build the site:

```bash
pnpm build
```

Preview the build:

```bash
pnpm preview
```

Build and run Docker locally:

```bash
docker build -t laguntza-fisioterapia .
docker run -p 8080:8080 laguntza-fisioterapia
```

The deployment workflow lives in `.github/workflows/deploy-server.yml`.
It deploys when you run the workflow by hand, or when the format workflow
passes on `master` and the commit message contains `[deploy]`.

Required GitHub secrets:

```text
SERVER_HOST
SERVER_USER
SERVER_SSH_KEY
SERVER_PORT
```

Deploy with a tagged commit:

```bash
git commit -m "Update services page [deploy]"
git push origin master
```

## Contributing

1. Create a branch.
2. Make a focused change.
3. Run `pnpm format`.
4. Run `pnpm build`.
5. Open a pull request with the reason for the change and any visual checks.

Report bugs through GitHub Issues. Include the page URL, the browser, the steps
to reproduce, and screenshots when the bug affects layout.

## License

This project uses the [MIT License](./LICENSE).

## Clinic

Laguntza Fisioterapia

Zubitxo Plaza, 3

20130 Urnieta, Gipuzkoa

[www.laguntzafisioterapia.com](https://www.laguntzafisioterapia.com)
