import { defineConfig } from 'vite';

// relative base so the build works from any folder or sub-path (e.g. GitHub Pages project sites)
export default defineConfig({
  base: './',
  build: { assetsInlineLimit: 0 },
});
