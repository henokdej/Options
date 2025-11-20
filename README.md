# Options Machine

An interactive React + TypeScript app that teaches options basics to teens using a cartoony walkthrough and a live "options machine" where learners can see how strike, price, time, volatility, and position affect payoffs.

## Getting started

1. Install Node.js 18+.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open the printed URL (usually http://localhost:5173) to explore the lessons and interactive payoff graph.

> **Note:** The styling uses Tailwind utility classes loaded from the CDN in `src/index.css` so you can run the app without setting up a Tailwind build step.

## Scripts

- `npm run dev` – start Vite dev server.
- `npm run build` – type-check and build for production.
- `npm run lint` – run ESLint checks.
- `npm run preview` – preview the production build.

## Project structure

- `src/App.tsx` – the full learning journey and options machine logic.
- `src/main.tsx` – React entry point.
- `src/index.css` – base styles and Tailwind CDN import.
- `vite.config.ts` – Vite configuration for React.
