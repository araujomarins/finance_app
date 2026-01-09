# Finances App

Track monthly predictions, income, and analyze credit card statements.

## Features

- Financial Planning: add predictions, income, and view totals.
- Monthly Analyzer: upload a CSV statement and review totals and merchants.
- Google login via a custom Express OAuth backend.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express + Passport (Google OAuth)

## Quick Start

```sh
npm install
npm run env:setup
npm run dev
```

In another terminal:

```sh
cd server
npm install
npm run dev
```

## Environment Setup

Templates live at `.env.example` and `server/.env.example`.

Root `.env`:

```
VITE_API_URL=http://localhost:4000
```

Server `.env`:

```
PORT=4000
SERVER_URL=http://localhost:4000
CLIENT_URL=http://localhost:5173
SESSION_SECRET=change-me
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## CSV Format (Monthly Analyzer)

The file must include headers:

```
date,title,amount
2025-12-29,Uber Uber *Trip Help.U,49.77
```

## Linting

```sh
npm run lint
```

## Deployment Notes

- Frontend: set `VITE_API_URL` to the backend URL.
- Backend: set `CLIENT_URL` and `SERVER_URL` to your deployed domains.
- Google OAuth: add the redirect URI `https://YOUR_BACKEND/auth/google/callback`.
