# Laguntza Fisioterapia Webpage

**🌐 Website: [www.laguntzafisioterapia.com](https://www.laguntzafisioterapia.com)**

Welcome to the Laguntza Fisioterapia website repository! This project is a modern, multilingual (Basque and Spanish) website for Laguntza Fisioterapia, a physiotherapy center based in Urnieta, Gipuzkoa.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Project Structure](#project-structure)
- [Customization](#customization)
- [Contributing](#contributing)
- [License](#license)

---

## About

Laguntza Fisioterapia offers specialized physiotherapy services, focusing on pain treatment and sports injury rehabilitation. The website provides information about services, contact details, and blog posts, and is designed to be accessible, responsive, and easy to maintain.

## Features

- **Multilingual**: Supports Basque (eu) and Spanish (es) languages.
- **Modern Design**: Clean, responsive UI with theme customization.
- **SEO Optimized**: Includes meta tags, Open Graph, and sitemap support.
- **Blog**: Easily publish and manage blog posts using MDX.
- **Contact & Location**: Integrated contact forms and interactive map.
- **Accessibility**: Follows best practices for accessibility.
- **Easy Customization**: Built with modular components for rapid updates.

## Tech Stack

- [Astro](https://astro.build/) – Static site generator
- [TypeScript](https://www.typescriptlang.org/) – Type safety
- [MDX](https://mdxjs.com/) – Blog content
- [GSAP](https://greensock.com/gsap/) – Animations
- [Leaflet](https://leafletjs.com/) – Interactive maps
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) – Theming
- [i18n](https://docs.astro.build/en/guides/integrations-guide/i18n/) – Internationalization

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-org/laguntza-fisioterapia.git
   cd laguntza-fisioterapia
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   pnpm install
   ```

3. **Start the development server:**
   ```sh
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser:**
   Visit [http://localhost:4321](http://localhost:4321) (or the port shown in your terminal).

## Development

- **Build for production:**
  ```sh
  npm run build
  ```
- **Preview production build:**
  ```sh
  npm run preview
  ```

### Scripts

- `dev` – Start local development server
- `build` – Build the site for production
- `preview` – Preview the production build

## Project Structure

```
src/
  components/      # Reusable UI components
  layouts/         # Layout components
  pages/           # Astro pages (routes)
  styles/          # Global and theme CSS
  i18n/            # Internationalization utilities
  utils/           # Helper functions and config
  images/          # Static images and icons
public/            # Static assets (served as-is)
astro.config.mjs   # Astro configuration
```

## Customization

- **Branding**: Update logo and favicon in `src/images/` and `public/`.
- **Theme**: Edit CSS variables in `src/styles/theme.css`.
- **Navigation & Footer**: Update navigation items in `src/config/nav.js` and footer links in `src/config/footer.js`.
- **Content**: Edit or add pages in `src/pages/`, and blog posts in `src/pages/[lang]/blog/posts/`.

For more details, see the [Theme Setup Guide](./src/pages/theme/theme-setup.mdx) and [Customizing Odyssey Theme](./src/pages/theme/customizing-odyssey.mdx).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](./LICENSE).

---

**Laguntza Fisioterapia**  
Zubitxo Plaza, 3, 20130 Urnieta, Gipuzkoa  
[Google Maps](https://maps.app.goo.gl/mh7BNkcgFQ5Z8fuF9)