# Captchalogue Frontend

Web client for interacting with the `CaptchalogueArtifact` smart contract on Sepolia.

## Features

- Wallet-gated dashboard layout with sidebar navigation.
- Drag-and-drop artwork upload backed by an in-browser IPFS node (Helia).
- Mint, Explore, Verify, and Privacy pages mapped to every public contract function.
- Toast-style status messages and a Sepolia network indicator.
- Hash routing for friction-free GitHub Pages hosting.

## Stack

- React + Vite
- React Router (HashRouter)
- Ethers.js v6
- Helia + UnixFS (browser-only IPFS)

## Pages

- `/` Connect Wallet (landing page; gates the rest of the app)
- `/app` Dashboard (account snapshot, owned artifact count, quick links)
- `/app/mint` Mint Artifact (drag-and-drop image upload + on-chain mint)
- `/app/explore` Explore (look up any artifact by token ID)
- `/app/verify` Verify (submit existence and possession attestations)
- `/app/privacy` Privacy (toggle a token's public/private state)
- `/app/about` About (project overview and contract link)

## Prerequisites

- Node.js LTS and npm
- A deployed `CaptchalogueArtifact` contract address on Sepolia
- MetaMask installed in your browser

## Quick Start

From `frontend/`:

```powershell
npm install
copy .env.example .env
```

Set your deployed contract address in `.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Run in development mode:

```powershell
npm run dev
```

## Production Build

```powershell
npm run build
npm run preview
```

## Deploy to GitHub Pages

This app uses Vite `base: "./"` and HashRouter for GitHub Pages project-site compatibility (no SPA fallback configuration needed).

### Manual deployment

```powershell
npm run deploy
```

This publishes `dist/` to the `gh-pages` branch.

### GitHub Actions deployment

Workflow file: `.github/workflows/frontend-gh-pages.yml`

1. Add repository secret `VITE_CONTRACT_ADDRESS`
2. Enable GitHub Pages with **Source = GitHub Actions**
3. Push to `main`

## Network Requirements

- Wallet must be connected to Sepolia (`chainId: 11155111`).
- Write transactions are blocked when on a different network; the topbar exposes a one-click switch.

## IPFS Notes (Helia)

- Image uploads run entirely in the browser. No third-party API keys, no secrets in the bundle.
- The browser tab is the originating IPFS peer for any file you upload. **Keep the tab open during your demo** so the metadata image stays reachable through public gateways.
- The minted token URI is always a valid `ipfs://<cid>`, regardless of pinning. To make content reliably available beyond your tab, pin the CID with an external IPFS service.

## Security

- Do not commit `.env` files.
- Do not expose private keys in frontend code or environment variables.
