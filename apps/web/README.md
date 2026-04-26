# Web App (Spot)

This is the mobile-first React/Vite application for Spot in the new monorepo layout.

## Required env for API connectivity

Set `VITE_API_BASE_URL` so the web app points to the right backend:

- Local API example: `VITE_API_BASE_URL=http://127.0.0.1:8080`
- Hosted API example: `VITE_API_BASE_URL=https://<your-api-host>`

If this variable is not set, the app defaults to `http://127.0.0.1:8080`.

## How to run locally (Desktop)

1. Make sure you are in the `apps/web` directory:
   ```bash
   cd apps/web
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the displayed `http://localhost:8080` (or `5173`) link in your browser.

## Quality checks

Run these before submitting changes:

```bash
npm run test
npm run build
```

## Vercel deployment

1. Set the Vercel project root directory to `apps/web`.
2. Add `VITE_API_BASE_URL` in Vercel Environment Variables (Production, Preview, and Development scopes as needed).
3. Set `VITE_API_BASE_URL` to your public API host (for example, `https://<your-api-host>`), not localhost.
4. Redeploy after env changes. `VITE_*` values are baked in at build time for Vite.
5. Deploy preview first, validate core user flows, then promote to production.

## Related runtime services

- API server is under `apps/api`.
- Shared on-device intent engine is under `packages/intent-engine`.

## How to test on your iPhone (Mobile)

To test the app natively on your smartphone, both your computer and your phone must be connected to the **same Wi-Fi network**.

1. Start the Vite server and expose it to your local network by adding the `--host` flag:
   ```bash
   npm run dev -- --host
   ```
2. Look at the terminal output. You will see a `Network:` URL (e.g., `http://192.168.1.X:8080`).
3. Open Safari (or any browser) on your iPhone and enter that exact `Network` URL.
4. _Tip:_ For the best full-screen native app experience, tap the "Share" button in Safari and select **"Add to Home Screen"**. Launch the app from your home screen.
