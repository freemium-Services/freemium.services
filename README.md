# Freemium.Services Static Site Generator

Welcome to the **v2** generation engine for Freemium.Services. This repository contains the unified build pipeline for generating a highly performant, SEO-optimized static site serving the largest verified directory of freemium and open-source tools.

## Key Features

- **Single Build Pipeline**: Driven entirely by `builder.js`.
- **Programmatic SEO**: Automatically generates fully-structured HTML pages complete with JSON-LD (SoftwareApplication, FAQPage, HowTo schemas).
- **Hreflang Generation**: Built-in support for multilingual canonicals.
- **Glassmorphism UI**: Beautiful, lightweight CSS system (`src/css/main.css`).
- **AI Chat Widget**: Interactive AI-driven widget embedded dynamically on all tool pages (`src/js/chat-widget.js`).
- **Canonical Routing**: Vercel configuration (`vercel.json`) enforcing redirection from `freemium-services.vercel.app` to `freemium.services`.

## Getting Started

### Prerequisites
- Node.js >= 18.0.0

### Installation

```bash
git clone https://github.com/freemium-Services/freemium.services.git
cd freemium.services-main
npm install
```

### Running the Build

To generate the static HTML files into the `/public` directory:

```bash
npm run build
```

You can then serve the `/public` folder using any static server:

```bash
npx serve public
```

## Architecture

The entire site is powered by the `data/tools.json` file. The schema enforces a minimum of ~800 words of rich content per tool, guaranteeing that every generated page passes strict SEO content-depth audits.

* `builder.js` - The master generator script.
* `data/tools.json` - The core database for all tools.
* `src/css/main.css` - Unified stylesheet.
* `src/js/chat-widget.js` - Client-side AI widget logic.
* `public/` - The generated output directory (excluded from git).

See `CONTRIBUTING.md` for guidelines on adding new tools or translating content.
