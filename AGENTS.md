# Pomo-san

React 19 + Vite + SCSS PWA app. Entry point: `src/main.jsx`.

## Dev commands

- `npm run dev` - dev server on port **5001** (not Vite default)
- `npm run build` - builds to `dist/`
- `npm run preview` - preview on port **5050**

## Architecture

- Timer logic runs in a **Web Worker** (`src/workers/timer.worker.js`) to avoid blocking UI
- SCSS uses `api: "modern"` (required for Vite 8 + sass 1.97+)
- PWA manifest and service worker auto-generated via `vite-plugin-pwa`

## Notes

- No test suite
- ESLint flat config (`eslint.config.js`)
- No CI/CD or pre-commit hooks