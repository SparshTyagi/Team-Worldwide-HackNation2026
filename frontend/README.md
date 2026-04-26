# Frontend App (Spot)

This is the mobile-first React/Vite application for Spot.

## How to run locally (Desktop)

1. Make sure you are in the `frontend` directory:
   ```bash
   cd frontend
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

## How to test on your iPhone (Mobile)

To test the app natively on your smartphone, both your computer and your phone must be connected to the **same Wi-Fi network**.

1. Start the Vite server and expose it to your local network by adding the `--host` flag:
   ```bash
   npm run dev -- --host
   ```
2. Look at the terminal output. You will see a `Network:` URL (e.g., `http://192.168.1.X:8080`).
3. Open Safari (or any browser) on your iPhone and enter that exact `Network` URL.
4. *Tip:* For the best full-screen native app experience, tap the "Share" button in Safari and select **"Add to Home Screen"**. Launch the app from your home screen.
