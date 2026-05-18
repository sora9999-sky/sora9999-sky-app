# Avicenna Pharmacy — Windows Desktop (.exe) Build Guide

This folder turns your already-deployed Avicenna Pharmacy web app into a real **Windows .exe** using **Electron**. You only need to do these steps **once on any Windows PC** to produce the installer; after that you can copy/install the `.exe` anywhere.

> Your deployed web URL is baked in: `https://rx-inventory-hub-6.emergent.host`
> The desktop app needs an internet connection to reach it.

---

## Prerequisites (one-time setup on a Windows machine)

1. **Install Node.js LTS** (v18 or v20) → https://nodejs.org/en/download
   After install, open **Command Prompt** and verify:
   ```
   node --version
   npm --version
   ```

2. **Copy this `desktop/` folder** from your Emergent project onto your Windows PC (e.g. via GitHub push, or download from Emergent).

3. *(Optional)* Replace `assets/icon.ico` with your own 256×256 `.ico` file for a custom app icon. A placeholder is fine — Electron will use a default icon if missing.

---

## Build the .exe

Open Command Prompt **inside the `desktop` folder** and run:

```
npm install
npm run build:installer
```

When it finishes (1–3 minutes), look in the **`dist/`** sub-folder. You will find:

- **`Avicenna Pharmacy Setup 1.0.0.exe`** — a normal Windows installer (creates Start-menu + Desktop shortcuts).

Want a single-file portable executable that needs no installation? Run instead:

```
npm run build:portable
```

That produces **`Avicenna Pharmacy 1.0.0.exe`** — a portable .exe you can put on a USB stick.

---

## Test it before building

To preview the desktop app *without* packaging:

```
npm install
npm start
```

A native window will open and load your pharmacy app.

---

## Pointing the .exe at a different server (advanced)

The URL is read from the environment variable `AVICENNA_URL`. To run it against, say, a local backend:

```
set AVICENNA_URL=http://localhost:3000
"Avicenna Pharmacy.exe"
```

---

## Notes & limits

- **Internet required.** The desktop window is a thin shell around your deployed Emergent web app — when you redeploy, the .exe automatically picks up the new version on next launch (no rebuild needed).
- **Camera barcode scanner** works inside the desktop app — the necessary `camera` permission is auto-granted by `main.js`.
- **USB barcode scanners** work out of the box (they act as keyboards).
- **MongoDB / FastAPI** are *not* bundled. The backend keeps running on Emergent's servers; the .exe is just the front-end window.
- If you ever need a fully **offline** desktop version (no internet, local database), that's a separate, larger rewrite — let me know and I can plan it.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails on Windows | Run Command Prompt as Administrator, or set `npm config set msvs_version 2019` |
| Camera doesn't open | Windows → Settings → Privacy → Camera → allow desktop apps |
| "Cannot reach Avicenna Pharmacy" dialog | Check internet, or that the production URL is up |
| Antivirus flags the .exe | Common for unsigned Electron apps. To remove the warning, you can later buy a code-signing certificate. |

That's it — you now have a Windows .exe of your pharmacy app.
