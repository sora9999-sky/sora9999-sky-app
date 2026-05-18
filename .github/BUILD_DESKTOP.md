# Build the Windows .exe in the cloud (no Windows PC needed)

This repo includes a GitHub Actions workflow that builds the Avicenna Pharmacy `.exe` for you on a Windows cloud runner. **Free for public repos**, and free up to 2,000 minutes/month even for private ones.

## One-time setup

1. **Push this project to GitHub.**
   In Emergent, click **"Save to GitHub"** in the top-right of the editor and follow the prompts. (If your repo is private, that's fine — GitHub Actions still works.)

2. **That's it.** The workflow file lives at `.github/workflows/build-desktop.yml` and is detected automatically.

## How to build a .exe

### Option A — Manual trigger (recommended the first time)

1. Open your repo on GitHub in a browser.
2. Click the **Actions** tab.
3. In the left sidebar, click **"Build Windows .exe"**.
4. Click the **"Run workflow"** dropdown on the right → **Run workflow** (green button).
5. Wait ~5–8 minutes. ☕

When it turns green, scroll to the bottom of the run page → **Artifacts** section. You'll see:

- `Avicenna-Pharmacy-Installer` — contains `Avicenna Pharmacy Setup 1.0.0.exe` (NSIS installer)
- `Avicenna-Pharmacy-Portable` — contains all built `.exe` files including the portable one

Download the ZIP, unzip → double-click the `.exe` on any Windows PC. **Done.**

### Option B — Tag-based release (clean versioned downloads)

If you tag a commit with a version, the workflow creates a proper **GitHub Release** with the `.exe` attached:

```
git tag v1.0.0
git push origin v1.0.0
```

After the build, go to your repo's **Releases** tab → download the `.exe` directly. Easier to share with users.

## What if I want to change the version number?

Edit the `"version"` field in `desktop/package.json` (e.g. `"1.0.1"`), commit, then either re-run the workflow manually or push a new `v1.0.1` tag.

## Costs

- **Public repo**: completely free, unlimited minutes.
- **Private repo**: 2,000 free minutes/month from GitHub. Each build uses ~5–8 minutes of a Windows runner (Windows minutes count 2× → ~10–16 minutes per build), so you can do roughly **120+ builds per month for free**.

## Troubleshooting

| Problem | Fix |
|---|---|
| Workflow doesn't appear in Actions tab | Make sure `.github/workflows/build-desktop.yml` is committed to the **default branch** (usually `main` or `master`). |
| Run fails on "Install frontend dependencies" | Check the log — usually a missing/locked `yarn.lock`. Delete it locally and let CI regenerate, or commit a working one. |
| Antivirus flags downloaded .exe | Normal for unsigned Electron apps. Buy a code-signing certificate later if you want the warning gone. |
| Want only the installer, not portable | Edit `.github/workflows/build-desktop.yml` and change `npm run build:all` to `npm run build:installer`. |

That's it — every time you click **Run workflow**, you get a fresh Windows `.exe` you can download, install, and use **offline forever**.
