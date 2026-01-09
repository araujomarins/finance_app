# Project Notes for Assistants

## Scope

This repo is a personal finance planner with two tabs:
- Financial Planning: predictions + income + summaries.
- Monthly Analyzer: CSV upload and statement breakdown.

## Stack

- Frontend: React + Vite (ESM modules).
- Backend: Node.js + Express in `server/`.
- Auth: Google OAuth via Passport; session cookies.

## Local Workflow

- Frontend: `npm run dev`
- Backend: `cd server && npm run dev`
- Env helper: `npm run env:setup` (copies `.env.example` files)

## Data Handling

- Predictions and income are stored in localStorage for now.
- CSV parser expects headers `date,title,amount`.
- Amounts can be negative for credits/refunds.

## Conventions

- Use `.jsx` for React components.
- Keep UI changes in `src/App.jsx` and styles in `src/App.css`.
- Avoid adding heavy dependencies unless requested.
- For each new feature, create and switch to a dedicated Git branch before making changes.
- Use a standard branch pattern: `feature/short-topic`, `fix/short-topic`, `chore/short-topic`, `docs/short-topic`, `refactor/short-topic`, `test/short-topic`, `hotfix/short-topic`.

## Auth Notes

- Backend uses `CLIENT_URL` and `SERVER_URL` env vars for redirects.
- Google OAuth redirect URI must be:
  `https://YOUR_BACKEND/auth/google/callback`
