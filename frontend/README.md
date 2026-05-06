# Captchalogue Frontend

React + Vite frontend for interacting with `CaptchalogueArtifact` on Sepolia.

## Local setup you must run

From this folder:

```powershell
npm install
copy .env.example .env
```

Then edit `.env` and set:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Run locally:

```powershell
npm run dev
```

## Build

```powershell
npm run build
npm run preview
```

## GitHub Pages deployment

This app is configured with Vite `base: "./"` for project-page compatibility.

### Option A (manual deploy from local)

```powershell
npm run deploy
```

This publishes `dist/` to a `gh-pages` branch (using the `gh-pages` package).

### Option B (automatic deploy with GitHub Actions)

Use the workflow at `.github/workflows/frontend-gh-pages.yml`.
After pushing to `main`, enable Pages in repo settings:

- Settings -> Pages
- Source: GitHub Actions

## Required network

- MetaMask must be connected to Sepolia (`11155111`).
- The app includes a "Switch to Sepolia" button.
