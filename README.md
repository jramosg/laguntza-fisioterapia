# Laguntza Fisioterapia Webpage

**🌐 Website: [www.laguntzafisioterapia.com](https://www.laguntzafisioterapia.com)**

Welcome to the Laguntza Fisioterapia website repository! This project is a modern, multilingual (Basque and Spanish) website for Laguntza Fisioterapia, a physiotherapy center based in Urnieta, Gipuzkoa.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [CI/CD](#cicd)
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
  pnpm build
  ```
- **Preview production build:**
  ```sh
  pnpm preview
  ```
- **Format code:**
  ```sh
  pnpm run format
  ```
- **Check formatting:**
  ```sh
  pnpm run format:check
  ```

### Scripts

- `dev` – Start local development server
- `build` – Build the site for production
- `preview` – Preview the production build
- `format` – Format code with Prettier
- `format:check` – Check if code is properly formatted

## CI/CD

This project uses GitHub Actions for automated testing, formatting checks, and deployment.

### Format Checks

All code is automatically checked for proper formatting using Prettier:

- **Triggers**: Runs on every push and pull request
- **Tools**: Uses pnpm with Node.js version from `.nvmrc`
- **Caching**: Automatically caches pnpm dependencies for faster builds

### Deployment

The project automatically deploys to the production server when:

1. **Code is pushed to the `master` branch**
2. **The commit message contains `[deploy]`**
3. **All format checks pass successfully**

#### Deployment Examples

```bash
# ✅ This will trigger deployment after format checks pass
git commit -m "Fix contact form attachments [deploy]"
git push origin master

# ❌ This will NOT trigger deployment (missing [deploy])
git commit -m "Fix minor typo"
git push origin master
```

#### Manual Deployment

You can also manually trigger deployment using the "Deploy to Server" workflow in the GitHub Actions tab, regardless of commit message.

#### Workflow Sequence

```
Push to master → Format Check → ✅ Success + [deploy] → Deploy to Server
                              → ❌ Failure or no [deploy] → No deployment
```

### Development Workflow

1. Create a feature branch from `master`
2. Make your changes
3. Run `pnpm run format:check` locally to verify formatting and fix any issues with `pnpm run format`
4. Push your branch and create a pull request
5. Format checks will run automatically on the PR
6. After review and approval, merge to `master`
7. If deploying, include `[deploy]` in your merge commit message

### Docker Container

You can also run the application using Docker:

1. **Build the Docker image:**

   ```sh
   docker build -t laguntza-fisioterapia .
   ```

2. **Run the container:**

   ```sh
   docker run -p 3000:8080 laguntza-fisioterapia
   ```

   Replace `3000` with any available port on your machine. The container exposes port `8080` by default.

3. **Access the application:**
   Visit [http://localhost:3000](http://localhost:3000) (or whatever port you specified).

## Project Structure

```
.github/           # GitHub Actions workflows
nginx/             # Nginx configuration
public/            # Static assets (served as-is)
  assets/          # Public assets (icons, fonts)
  fonts/           # Web fonts
src/
  components/      # Reusable UI components
    blog/          # Blog-specific components
    buttons/       # Button components
    cards/         # Card components
    core/          # Core layout components
    form-fields/   # Form input components
    forms/         # Complete form components
    head/          # HTML head components
    sections/      # Page section components
      heros/       # Hero section variants
    theme-switcher/ # Theme switching components
  config/          # Configuration files
  i18n/            # Internationalization utilities
  icons/           # SVG icons
  images/          # Static images and logos
    logos/         # Brand logo variants
  layouts/         # Layout components
  pages/           # Astro pages (routes)
    [lang]/        # Multilingual pages
  styles/          # Global and theme CSS
  utils/           # Helper functions
astro.config.mjs   # Astro configuration
package.json       # Dependencies and scripts
tsconfig.json      # TypeScript configuration
```

## Customization

- **Branding**: Update logo and favicon in `src/images/` and `public/`.
- **Theme**: Edit CSS variables in `src/styles/theme.css`.
- **Navigation & Footer**: Update navigation items in `src/config/nav.ts` and footer links in `src/config/footer.ts`.
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
