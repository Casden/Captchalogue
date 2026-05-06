import { useState } from "react";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import { explorerTxUrl, getWritableContract, hasContractAddress } from "../lib/contract";
import ImageDropzone from "../components/ImageDropzone";

export default function MintPage() {
  const { isCorrectNetwork, isConnected, getSigner } = useWallet();
  const toast = useToast();

  const [artifactName, setArtifactName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploadedUri, setUploadedUri] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [manualUri, setManualUri] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [lastMint, setLastMint] = useState(null);

  const effectiveUri = manualOverride ? manualUri.trim() : uploadedUri;
  const ready =
    isConnected &&
    isCorrectNetwork &&
    hasContractAddress() &&
    artifactName.trim().length > 0 &&
    effectiveUri.length > 0 &&
    !isMinting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ready) return;
    setIsMinting(true);
    try {
      const contract = await getWritableContract(getSigner);
      const tx = await contract.createArtifact(artifactName.trim(), effectiveUri, isPrivate);
      toast.info(`Mint transaction sent: ${tx.hash.slice(0, 10)}...`);
      const receipt = await tx.wait();
      setLastMint({ hash: tx.hash, blockNumber: receipt?.blockNumber });
      toast.success("Artifact minted successfully.");
      setArtifactName("");
      setIsPrivate(false);
      setUploadedUri("");
      setManualUri("");
    } catch (err) {
      toast.error(err?.shortMessage || err?.message || "Mint failed.");
    } finally {
      setIsMinting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mint Artifact</h1>
        <p className="page-sub">
          Create a new on-chain artifact NFT. Drop an image to upload it through the in-browser IPFS node.
        </p>
      </header>

      <div className="grid two-col">
        <section className="card">
          <h2>Artifact Image</h2>
          <ImageDropzone
            onUploaded={(uploaded) => setUploadedUri(uploaded?.uri || "")}
            onError={(message) => toast.error(message)}
            disabled={isMinting}
          />
          <div className="advanced-toggle">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(e) => setManualOverride(e.target.checked)}
              />
              Advanced: paste URI manually
            </label>
            {manualOverride && (
              <input
                type="text"
                placeholder="ipfs://... or https://..."
                value={manualUri}
                onChange={(e) => setManualUri(e.target.value)}
              />
            )}
          </div>
          <p className="hint">
            Images are uploaded through your configured Cloudflare endpoint and pinned to IPFS, so metadata
            remains available after leaving the tab.
          </p>
        </section>

        <section className="card">
          <h2>Details</h2>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Artifact name
              <input
                type="text"
                value={artifactName}
                onChange={(e) => setArtifactName(e.target.value)}
                maxLength={120}
                required
                placeholder="e.g. Vintage Camera #001"
              />
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Mark as private (hides name and URI from public reads)
            </label>

            <div className="readonly-field">
              <span className="readonly-label">Metadata URI</span>
              <code className="readonly-value">{effectiveUri || "(awaiting upload)"}</code>
            </div>

            <button type="submit" className="btn btn-primary" disabled={!ready}>
              {isMinting ? "Minting..." : "Mint Artifact"}
            </button>
          </form>

          {lastMint && (
            <div className="success-block">
              <div>Last mint succeeded in block #{lastMint.blockNumber}.</div>
              <a className="link" href={explorerTxUrl(lastMint.hash)} target="_blank" rel="noreferrer">
                View transaction on Etherscan
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
