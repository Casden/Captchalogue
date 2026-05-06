# Captchalogue

Captchalogue is an NFT-powered artifact registry for representing physical items as digital assets on Ethereum.  
This repository includes the smart contract, deployment tooling, tests, and a frontend DApp for wallet-based interaction.

## Features

- Mint artifact NFTs with custom metadata URIs.
- Store verification-oriented artifact fields on-chain.
- Support private/public artifact visibility behavior at the contract level.
- Deploy to Sepolia using Hardhat.
- Interact from a React + Vite frontend with MetaMask.
- Publish the frontend to GitHub Pages.

## Tech Stack

- Solidity `^0.8.20`
- Hardhat
- Ethers.js
- React + Vite
- GitHub Actions (optional Pages deploy)

## Repository Structure

| Path | Purpose |
|------|---------|
| `contracts/CaptchalogueArtifact.sol` | Core NFT artifact contract |
| `scripts/deployCaptchalogue.js` | Deployment script |
| `test/CaptchalogueArtifact.js` | Contract tests |
| `frontend/` | React frontend DApp |
| `hardhat.config.js` | Hardhat network and compiler configuration |
| `.env.example` | Backend/deployment environment template |

## Prerequisites

- Node.js LTS and npm
- A Sepolia RPC URL (Infura, Alchemy, QuickNode, etc.)
- A Sepolia wallet private key for deployment
- (Optional) Etherscan API key for source verification

## Smart Contract Setup

From the repository root:

```powershell
npm install
copy .env.example .env
```

Update `.env`:

```env
SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=...
ETHERSCAN_API_KEY=...
```

Compile and test:

```powershell
npm run compile
npm test
```

## Deploy to Sepolia

```powershell
npm run deploy:sepolia
```

The deploy script prints the contract address. Save it for frontend configuration.

## Verify Contract (Optional)

```powershell
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

The current contract has no constructor arguments.

## Frontend Setup

From `frontend/`:

```powershell
npm install
copy .env.example .env
```

Set the deployed contract address:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Run locally:

```powershell
npm run dev
```

Build for production:

```powershell
npm run build
```

## GitHub Pages

The frontend is configured for GitHub Pages compatibility.

- Manual deploy from `frontend/`:

```powershell
npm run deploy
```

- Or use the workflow at `.github/workflows/frontend-gh-pages.yml` and set repository secret `VITE_CONTRACT_ADDRESS`.
