# Captchalogue Frontend

Web client for interacting with the `CaptchalogueArtifact` smart contract on Sepolia.

## Features

- Wallet-gated dashboard layout with sidebar navigation.
- Drag-and-drop artwork upload with persistent IPFS pinning through a Cloudflare Worker + Pinata.
- "My Artifacts" gallery with an in-place edit modal (metadata, hide/show, evidence submission) for tokens you own.
- Verification anchored on-chain as evidence commitments (keccak256 of an evidence URL/CID) plus an event log carrying the URL itself.
- Hide-from-default-view toggle (UI-level redaction; on-chain storage remains readable - this is not encryption).
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
- `/app/artifacts` My Artifacts (gallery of your tokens with inline edit modal)
- `/app/artifacts/:tokenId` Artifact detail (full-page editor for a single token)
- `/app/explore` Explore (look up any artifact by token ID)
- `/app/about` About (project overview and contract link)

Editing metadata, hiding from default view, and submitting verification evidence all live inside `My Artifacts` (modal) or the artifact detail page; there are no separate Verify or Privacy tabs.

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

## Verification model (hybrid)

- The contract stores a single `bytes32` commitment + `uint64` timestamp per attestation type (existence, possession). It does not store a numeric score.
- The frontend computes the commitment client-side as `keccak256(toUtf8Bytes(evidenceUrl))` and submits both the commitment and the original URL to the contract.
- The URL is logged via `ExistenceEvidenceSubmitted` / `PossessionEvidenceSubmitted` events (cheap event-log storage), so off-chain UIs can recover it without paying for state slots.
- Transferring an artifact resets both commitments. The new owner needs to re-attest.

## Privacy model (soft / non-cryptographic)

- The "Hide from default view" toggle (`togglePrivacy` on-chain) only affects the convenience read `getPublicArtifact`, which returns `"HIDDEN"` and `""` for the name and metadata URI when the flag is set.
- Storage slots, the original `createArtifact` call data, and the standard `tokenURI(tokenId)` function still expose the full metadata URI to anyone who looks. The IPFS object referenced by that URI is also publicly fetchable.
- This is not encryption. For sensitive documents (e.g. deeds/titles) you would need a separate model that encrypts the file before pinning and stores only ciphertext + a commitment on-chain.

## Security

- Do not commit `.env` files.
- Do not expose private keys in frontend code or environment variables.
