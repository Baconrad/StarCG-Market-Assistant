# AI Coding Agent Instructions for StarCG Market Extension

## Project Overview
A WXT + Vue 3 browser extension for StarCG market integration. Uses TypeScript, Tailwind CSS, and WXT framework for cross-browser compatibility.

## Architecture

### Extension Structure (WXT Framework)
- **`entrypoints/background.ts`**: Service worker - long-lived background process for messaging and state management
- **`entrypoints/content.ts`**: Content script - injected into target pages (currently google.com)
- **`entrypoints/popup/`**: Extension UI - Vue 3 SFC components loaded in the popup interface
- **`components/`**: Reusable Vue components shared across the extension

### Build & Runtime
- **WXT** manages entry point compilation; each `.ts` file in `entrypoints/` becomes a separate extension script
- Changes to `entrypoints/` require full rebuild (not hot-reload)
- Popup runs in isolated context; background/content scripts can communicate via `browser.runtime.sendMessage()`

## Development Workflow

### Common Commands
```bash
pnpm dev                # Watch mode (Chrome), auto-rebuild on file changes
pnpm dev:firefox        # Watch mode for Firefox
pnpm build              # Production build
pnpm zip                # Create distributable .zip for submission
pnpm compile            # Type check (vue-tsc) - useful before commits
```

### Key Development Notes
- WXT auto-generates `manifest.json` from entry points
- Popup entry point requires manual reload in extension settings after changes
- Use `browser.runtime` APIs for cross-script communication
- Content script matches defined in `entrypoints/content.ts` (currently `*://*.google.com/*`)

## Code Patterns & Conventions

### Defining Entry Points
Use `defineBackground()` and `defineContentScript()` helpers from WXT:
```ts
// background.ts
export default defineBackground(() => {
  console.log('Background service worker loaded');
});
```

### Vue Component Style
Use `<script setup>` with TypeScript; scope styles to prevent conflicts:
```vue
<script lang="ts" setup>
import { ref } from 'vue';
const count = ref(0);
</script>
<template>
  <button @click="count++">{{ count }}</button>
</template>
<style scoped>
button { margin: 0.5rem; }
</style>
```

### Styling
- Primary CSS framework: **Tailwind CSS** (v4.1.18) configured via `@tailwindcss/vite` plugin
- Global styles in `assets/tailwind.css`
- Prefer Tailwind classes over scoped CSS in components

## Key Files & Configuration
- **`wxt.config.ts`**: Entry point and Vite plugin configuration
- **`tsconfig.json`**: TypeScript compiler settings and path aliases
- **`package.json`**: Dependencies, scripts, and project metadata
- **`pnpm-workspace.yaml`**: Workspace configuration (monorepo support)

## IDE & Tools
- Recommended: VS Code + Volar extension for Vue 3 support
- TypeScript version: 5.9.3
- Vue version: 3.5.27
- Use `vue-tsc` before commits for type validation

## Important Discovery Notes
- No existing testing framework configured - recommend adding when scale increases
- Project uses `pnpm` (package manager) - not npm/yarn
- Extension autoload features depend on manifest.json manifest version (check WXT docs)
- Firefox build may differ slightly from Chrome/Chromium; test both targets before release
