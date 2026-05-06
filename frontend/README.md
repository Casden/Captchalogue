# Captchalogue Frontend

Web client for interacting with the `CaptchalogueArtifact` smart contract on Sepolia.

## Features

- Wallet-gated dashboard layout with sidebar navigation.
- Drag-and-drop artwork upload with persistent IPFS pinning through a Cloudflare Worker + Pinata.
- Mint, Explore, Verify, and Privacy pages mapped to every public contract function.
- Toast-style status messages and a Sepolia network indicator.
- Hash routing for friction-free GitHub Pages hosting.

## Stack

- React + Vite
- React Router (HashRouter)
- Ethers.js v6
- Cloudflare Workers (upload proxy)
- Pinata HTTP API (server-side pinning)

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

Set your Cloudflare Worker upload URL in `.env`:

```env
VITE_UPLOAD_API_URL=https://your-worker-name.your-subdomain.workers.dev/upload
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

## IPFS Notes (Pinned Uploads)

- Image uploads are sent to your Cloudflare Worker, which pins to Pinata using a server-side JWT.
- End users do not need a Pinata key; they only need MetaMask + Sepolia ETH.
- The minted token URI is `ipfs://<cid>` and remains valid for NFT metadata.
- Keep `PINATA_JWT` only in Cloudflare Worker secrets, never in frontend code.

## Security

- Do not commit `.env` files.
- Do not expose private keys in frontend code or environment variables.
