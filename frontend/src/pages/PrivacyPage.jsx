import { useState } from "react";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import { explorerTxUrl, getWritableContract, hasContractAddress } from "../lib/contract";

export default function PrivacyPage() {
  const { isConnected, isCorrectNetwork, getSigner } = useWallet();
  const toast = useToast();

  const [tokenId, setTokenId] = useState("1");
  const [makePrivate, setMakePrivate] = useState(true);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isConnected || !isCorrectNetwork || !hasContractAddress()) {
      toast.error("Connect to Sepolia with the contract address configured.");
      return;
    }
    setBusy(true);
    try {
      const contract = await getWritableContract(getSigner);
      const tx = await contract.togglePrivacy(tokenId, makePrivate);
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success(makePrivate ? "Token marked private." : "Token marked public.");
      console.info(explorerTxUrl(tx.hash));
    } catch (err) {
      toast.error(err?.shortMessage || err?.message || "Privacy update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Privacy</h1>
        <p className="page-sub">
          Toggle public visibility for any token you own. Private artifacts hide their name and metadata URI
          from public reads.
        </p>
      </header>

      <section className="card narrow-card">
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Token ID
            <input
              type="number"
              min="1"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              required
            />
          </label>

          <div className="segmented">
            <button
              type="button"
              className={`segmented-option ${makePrivate ? "segmented-active" : ""}`}
              onClick={() => setMakePrivate(true)}
            >
              Make Private
            </button>
            <button
              type="button"
              className={`segmented-option ${!makePrivate ? "segmented-active" : ""}`}
              onClick={() => setMakePrivate(false)}
            >
              Make Public
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Updating..." : "Update Privacy"}
          </button>
        </form>
      </section>
    </div>
  );
}
