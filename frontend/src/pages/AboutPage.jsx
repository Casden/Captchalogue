import { CONTRACT_ADDRESS, explorerAddressUrl } from "../lib/contract";

export default function AboutPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>About Captchalogue</h1>
        <p className="page-sub">
          Captchalogue is an NFT-powered artifact registry that represents physical items as
          on-chain digital records, with a two-part verification model and hybrid privacy.
        </p>
      </header>

      <section className="card">
        <h2>How it works</h2>
        <ul className="content-list">
          <li>
            <strong>Mint</strong>: drop an image, give it a name, and the app stores the file via
            in-browser IPFS (Helia), then mints an ERC-721-compatible artifact NFT on Sepolia.
          </li>
          <li>
            <strong>Verify</strong>: each artifact carries an existence score (0-50) and a
            possession score (0-50) that the owner can submit with evidence.
          </li>
          <li>
            <strong>Privacy</strong>: artifacts can be public or private. Private tokens hide their
            name and metadata URI from public reads while keeping ownership and scores visible.
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>Technology</h2>
        <ul className="content-list">
          <li>Solidity 0.8.20 contract on Sepolia, deployed via Hardhat.</li>
          <li>React + Vite frontend with wallet-gated routing.</li>
          <li>Ethers.js v6 for read and write contract interactions through MetaMask.</li>
          <li>Helia + UnixFS for fully in-browser IPFS uploads (no third-party keys).</li>
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
