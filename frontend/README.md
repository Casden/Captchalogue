# Captchalogue Frontend

Web client for interacting with the `CaptchalogueArtifact` smart contract on Sepolia.

## Features

- Connect wallet via MetaMask
- Detect and switch to Sepolia
- Mint artifact NFTs (`createArtifact`)
- Read public artifact data by token ID
- Build and deploy to GitHub Pages

## Stack

- React
- Vite
- Ethers.js

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

This app uses Vite `base: "./"` for GitHub Pages project-site compatibility.

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

- Wallet must be connected to Sepolia (`chainId: 11155111`)
- Write transactions are blocked when on a different network

## Security

- Do not commit `.env` files.
- Do not expose private keys in frontend code or environment variables.
