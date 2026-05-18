# Avicenna Pharmacy — Offline Windows .exe (Lifetime, No Internet)

This packages your pharmacy app into a **fully offline Windows .exe**. Once built and installed, it runs forever on any Windows PC with **zero internet, no Emergent, no monthly cost**.

## What you get

- A real Windows installer `.exe` (and an optional portable single-file `.exe`).
- All data (items, sales, stock) stored locally in a JSON file on the PC:
  `C:\Users\<you>\AppData\Roaming\Avicenna Pharmacy\pharmacy.json`
- Pre-loaded with 12 sample pharmacy items on first launch.
- Camera barcode scanner + USB barcode scanner both work offline.
- No server, no MongoDB, no Python — just the .exe.

---

## How to build it (one-time, on a Windows PC)

### Prerequisites
1. **Node.js LTS** (v18 or v20) → https://nodejs.org/en/download/
2. **Yarn** (run once after Node install): `npm install -g yarn`
3. The whole `/app` folder from Emergent on your PC (push to GitHub → `git clone`, or download the project).

### One command
Open Command Prompt inside the `desktop` folder and run:

```
build-exe.bat
```

That single batch file does everything:
1. Builds the React frontend (with `PUBLIC_URL=./` so it loads from `file://`).
2. Copies the build into `desktop/app/`.
3. Installs Electron + electron-builder.
4. Produces the installer.

When it finishes (~3–5 min the first time), look in **`desktop/dist/`** — you'll see:

| File | Description |
|---|---|
| `Avicenna Pharmacy Setup 1.0.0.exe` | Installer (creates desktop + Start-menu shortcuts) |
| `Avicenna Pharmacy 1.0.0.exe`       | Portable single-file (just double-click, no install) |

Copy either `.exe` to any Windows PC and it runs. **No internet ever needed.**

---

## Where is the data stored?

On the PC that runs the .exe:
```
C:\Users\<username>\AppData\Roaming\Avicenna Pharmacy\pharmacy.json
```

- This file is created on first launch and seeded with 12 sample items.
- Back it up by simply copying that file.
- Move it to another PC by copying the same file into the same path on the new PC.
- The app menu **File → Open data folder** opens this location directly.

---

## Test it without building (developer mode)

```
cd desktop
npm install
cd ..\frontend && set PUBLIC_URL=./ && yarn build && cd ..\desktop
xcopy /e /i /y ..\frontend\build app
npm start
```

Or just run `build-exe.bat` once, then `npm start` for repeat tests.

---

## Customising

- **App icon**: drop a 256×256 `icon.ico` into `desktop/assets/`. (Without one, Electron uses a default icon.)
- **App name**: edit `productName` in `desktop/package.json`.
- **Camera scanner**: works out of the box if Windows has camera permission for the app.
- **Different data location**: not exposed by default; the file is at the standard Windows AppData path.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `yarn` not recognised | Run `npm install -g yarn` first |
| `npm install` errors on first run | Run Command Prompt **as Administrator** |
| `electron-builder` errors about symlinks | Same — Admin Command Prompt fixes most issues |
| Antivirus flags the unsigned `.exe` | Normal for unsigned Electron builds. To make the warning go away you need a paid code-signing certificate (~$70/yr). |
| Camera doesn't open | Windows → Settings → Privacy → Camera → allow desktop apps |
| Want to wipe and start over | Delete `pharmacy.json` from the AppData folder shown above |

---

## What this isn't

- **Not** a multi-PC system. Each .exe has its own local database. If you want multiple cashiers sharing inventory in real-time, you'd need a small LAN server (different project).
- **Not** a SaaS / cloud version — that's already running at your Emergent deployment URL.

That's it — **build once, use forever**.
