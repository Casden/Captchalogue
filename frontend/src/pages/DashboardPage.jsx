import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../wallet/WalletContext";
import { explorerAddressUrl, getReadonlyContract, hasContractAddress, CONTRACT_ADDRESS } from "../lib/contract";

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function DashboardPage() {
  const { account, provider, isCorrectNetwork } = useWallet();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!provider || !account || !hasContractAddress()) return;
      setLoading(true);
      setError("");
      try {
        const contract = getReadonlyContract(provider);
        const result = await contract.balanceOf(account);
        if (!cancelled) setBalance(Number(result));
      } catch (err) {
        if (!cancelled) setError(err?.shortMessage || err?.message || "Could not read balance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [account, provider]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="page-sub">
          Welcome to Captchalogue. Here is a snapshot of your account and quick links into the app.
        </p>
      </header>

      <div className="grid three-col">
        <section className="stat-card">
          <span className="stat-label">Connected Address</span>
          <span className="stat-value" title={account}>{shorten(account)}</span>
          <span className="stat-meta">
            {isCorrectNetwork ? "Sepolia testnet" : "Wrong network"}
          </span>
        </section>

        <section className="stat-card">
          <span className="stat-label">Owned Artifacts</span>
          <span className="stat-value">
            {loading ? "..." : error ? "—" : balance ?? "—"}
          </span>
          <span className="stat-meta">{error || "via balanceOf()"}</span>
        </section>

        <section className="stat-card">
          <span className="stat-label">Contract</span>
          <span className="stat-value mono" title={CONTRACT_ADDRESS}>
            {CONTRACT_ADDRESS ? shorten(CONTRACT_ADDRESS) : "Not set"}
          </span>
          <span className="stat-meta">
            {CONTRACT_ADDRESS ? (
              <a className="link" href={explorerAddressUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">
                View on Etherscan
              </a>
            ) : (
              "Set VITE_CONTRACT_ADDRESS"
            )}
          </span>
        </section>
      </div>

      <section className="card">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/app/mint" className="quick-action">
            <strong>Mint</strong>
            <span>Create a new artifact NFT with an image upload.</span>
          </Link>
          <Link to="/app/artifacts" className="quick-action">
            <strong>My Artifacts</strong>
            <span>Browse, edit, hide, and submit evidence for tokens you own.</span>
          </Link>
          <Link to="/app/transfer" className="quick-action">
            <strong>Transfer</strong>
            <span>Send an artifact you own to another wallet.</span>
          </Link>
          <Link to="/app/explore" className="quick-action">
            <strong>Explore</strong>
            <span>Look up any artifact by token ID.</span>
          </Link>
          <Link to="/app/about" className="quick-action">
            <strong>About</strong>
            <span>How Captchalogue's verification and privacy work.</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
