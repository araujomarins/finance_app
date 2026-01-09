# Repository Guidelines

## Project Structure & Module Organization

The frontend is a Vite + React app. UI code lives in `src/`, with `src/main.jsx` as the entry point and `src/App.jsx` for the main view. Static HTML is in `index.html`. The backend lives in `server/` with the OAuth server entry at `server/index.js`. Keep future tests in `tests/` (or `src/__tests__/`) and static assets in `src/assets/`.

## Build, Test, and Development Commands

Frontend commands (from `package.json`):

```sh
npm install       # install dependencies
npm run dev       # start the Vite dev server
npm run build     # production build
npm run preview   # preview the production build locally
```

Backend commands (from `server/package.json`):

```sh
cd server
npm install       # install server dependencies
npm run dev       # start the OAuth server on :4000
```

Keep commands short and deterministic; prefer scripts checked into the repo over ad-hoc shell instructions.

## Coding Style & Naming Conventions

Use `.jsx` for React components. Prefer `PascalCase` for component names, `camelCase` for functions/variables, and `kebab-case` for filenames if you add non-component files. A formatter/linter is not configured yet; consider adding Prettier/ESLint when the codebase grows.

## Testing Guidelines

No testing framework is set up yet. When tests are introduced, document the framework, how to run it, and naming rules (for example, `*.test.jsx` in `tests/`).

## Commit & Pull Request Guidelines

There is no Git history yet, so no established commit message conventions exist. Consider adopting Conventional Commits (`feat:`, `fix:`, `chore:`) from the start and keep messages scoped and imperative. For pull requests, include a short description of intent, relevant issue links, and screenshots or logs when UI or behavior changes.

## Security & Configuration Tips

Store secrets in environment variables, never in version control. Use `.env.example` and `server/.env.example` as templates; keep `.env` and `server/.env` out of Git. OAuth requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` in `server/.env`.
