# Captchalogue — Hardhat + Sepolia

Smart contract setup with a separate frontend app in `frontend/`.

## What You Need Locally

1. **Node.js LTS** (includes `npm`).  
   - Download: https://nodejs.org/en  
   - In PowerShell, confirm: `node -v` and `npm -v`

2. **A Sepolia RPC URL** (free tier is fine): Infura, Alchemy, QuickNode, or similar.

3. **A Sepolia wallet private key** for deployment only — use an account funded with **Sepolia ETH** only (never your mainnet key).

4. **(Optional)** Etherscan API key for contract verification: https://etherscan.io/apis

---

## Setup (machine steps)

Open a terminal in this folder (`Captchalogue`), then:

```powershell
npm install
```

Copy environment template and edit:

```powershell
copy .env.example .env
# Edit .env: set SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY (and optionally ETHERSCAN_API_KEY)
```

Compile and run tests:

```powershell
npm run compile
npm test
```

---

## Deploy to Sepolia

```powershell
npm run deploy:sepolia
```

The script prints the deployed contract address; keep it for the course submission and future frontend ABI wiring.

Gas is paid from the Sepolia ETH balance on the wallet matching `SEPOLIA_PRIVATE_KEY`. Use a faucet such as Metana Sepolia faucet (see your course handout) if needed.

---

## Verify on Etherscan (optional)

After deploy, with `ETHERSCAN_API_KEY` in `.env`:

```powershell
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

This contract has no constructor arguments.

---

## Project layout

| Path | Purpose |
|------|---------|
| `contracts/CaptchalogueArtifact.sol` | NFT artifact contract |
| `scripts/deployCaptchalogue.js` | Sepolia/network deploy script |
| `test/CaptchalogueArtifact.js` | Hardhat tests |
| `frontend/` | React/Vite MetaMask UI and GitHub Pages deploy config |
| `hardhat.config.js` | Solidity 0.8.20, Sepolia network, Etherscan |
| `.env.example` | Template for RPC URL and keys |

---

## Notes

- **Do not commit** `.env`; it is listed in `.gitignore`.
- If you previously compiled in Remix inside this folder, you can delete any stray Remix `artifacts` output; Hardhat will regenerate `artifacts/` and `cache/` on `compile`.
