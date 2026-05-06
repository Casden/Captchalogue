import { CONTRACT_ADDRESS, explorerAddressUrl } from "../lib/contract";

export default function AboutPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>About Captchalogue</h1>
        <p className="page-sub">
          Captchalogue is an NFT-powered artifact registry that represents physical items as on-chain
          digital records, with a hybrid verification model and an explicitly soft privacy toggle.
        </p>
      </header>

      <section className="card">
        <h2>How it works</h2>
        <ul className="content-list">
          <li>
            <strong>Mint</strong>: drop an image, give it a name, and the app pins the file to IPFS
            through a Cloudflare Worker + Pinata, then mints an ERC-721 artifact on Sepolia.
          </li>
          <li>
            <strong>Verify</strong>: the owner submits an evidence URL or IPFS CID for "existence" and
            "possession". The frontend hashes it with keccak256 and the contract stores only the
            commitment + timestamp; the original URL is captured in the event log. Transferring the
            artifact resets both commitments.
          </li>
          <li>
            <strong>Hide from default view</strong>: artifacts can be flagged as hidden, which redacts
            the convenience read for outside callers. This is a UI-level hint, not encryption: storage
            slots, calldata history, and tokenURI still expose the metadata URI on-chain.
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>Technology</h2>
        <ul className="content-list">
          <li>Solidity 0.8.24 contract on Sepolia, built on OpenZeppelin's ERC721 + ERC721Enumerable + IERC4906.</li>
          <li>React + Vite frontend with wallet-gated routing.</li>
          <li>Ethers.js v6 for read and write contract interactions through MetaMask.</li>
          <li>Cloudflare Worker proxy to Pinata for persistent IPFS pinning (no per-user keys).</li>
        </ul>
      </section>

      <section className="card">
        <h2>Links</h2>
        <ul className="content-list">
          <li>
            Deployed contract:{" "}
            {CONTRACT_ADDRESS ? (
              <a className="link" href={explorerAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
                {CONTRACT_ADDRESS}
              </a>
            ) : (
              <em>not configured</em>
            )}
          </li>
          <li>Network: Sepolia (chainId 11155111)</li>
        </ul>
      </section>
    </div>
  );
}
