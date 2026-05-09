# Contributing to Freemium.Services

We welcome contributions to the directory! Whether you're adding a new open-source tool, improving a self-hosting guide, or extending our translation matrix, your help makes this directory the definitive source for sovereign developers.

## How to Add a New Tool

1. Open `data/tools.json`.
2. Add a new JSON object for your tool following the existing schema.

**Requirements for Tool Acceptance:**
- Must be Open Source (MIT, Apache, AGPL, etc.) OR offer a highly generous Freemium tier that does not vendor-lock data.
- The `description` field **must** be at least 800 words long to satisfy our SEO depth requirements. It should cover what the tool is, why developers use it in 2026, and its architectural benefits.
- Include a working `install` snippet (preferably a Docker command or `docker-compose` equivalent).
- Include an array of at least 3 `features`.
- Include an array of at least 2 `faq` items.
- Reference at least 2 `alternatives`.

## Build & Test Locally

Before submitting your PR, ensure the build succeeds locally:

```bash
npm run build
```

Verify that your new HTML page was successfully generated inside `public/tools/<your-tool-id>.html`.

## Code Style

- Do not modify files inside the `public/` folder manually. They will be overwritten on every build.
- If making styling changes, modify `src/css/main.css`.
- If modifying the AI widget, edit `src/js/chat-widget.js`.

All PRs are subject to a GitHub Action CI check that verifies the build succeeds.
