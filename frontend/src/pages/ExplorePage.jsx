import { useState } from "react";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import { getReadonlyContract, hasContractAddress } from "../lib/contract";
import ArtifactCard from "../components/ArtifactCard";

export default function ExplorePage() {
  const { provider } = useWallet();
  const toast = useToast();

  const [tokenId, setTokenId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [loadedTokenId, setLoadedTokenId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!hasContractAddress()) {
      toast.error("Contract address not configured.");
      return;
    }
    setLoading(true);
    try {
      const contract = getReadonlyContract(provider);
      const result = await contract.getPublicArtifact(tokenId);
      setData({
        owner: result.owner,
        artifactName: result.artifactName,
        metadataURI: result.metadataURI,
        isPrivate: Boolean(result.isPrivate),
        createdAt: Number(result.createdAt),
        existenceCommitment: result.existenceCommitment,
        existenceAttestedAt: Number(result.existenceAttestedAt),
        possessionCommitment: result.possessionCommitment,
        possessionAttestedAt: Number(result.possessionAttestedAt),
      });
      setLoadedTokenId(tokenId);
    } catch (err) {
      setData(null);
      toast.error(err?.shortMessage || err?.message || "Could not load artifact.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Explore</h1>
        <p className="page-sub">
          Look up any artifact by its token ID. Public artifacts show full details; hidden ones reveal only their
          evidence commitments.
        </p>
      </header>

      <section className="card">
        <form className="form inline-form" onSubmit={handleSubmit}>
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Loading..." : "Load Artifact"}
          </button>
        </form>
      </section>

      {data && <ArtifactCard tokenId={loadedTokenId} data={data} />}
    </div>
  );
}
