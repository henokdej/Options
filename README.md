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

### Viewing on an iPad or another device

To try the app on an iPad while developing locally:

1. Start the dev server and bind it to your network interface:

   ```bash
   npm run dev -- --host
   ```

2. Find your computer's local IP address (e.g., `192.168.1.50`).
3. On your iPad (connected to the same Wi‑Fi), open `http://<your-ip>:5173`.

If you prefer to preview a production build, run `npm run preview -- --host` and visit the same IP:port from the iPad.

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
