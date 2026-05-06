import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import { explorerTxUrl, getReadonlyContract, getWritableContract, hasContractAddress } from "../lib/contract";
import { ipfsUriToGateway } from "../lib/ipfs";

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

function formatTimestamp(unixSeconds) {
  if (!unixSeconds) return null;
  const n = Number(unixSeconds);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toLocaleString();
}

function shortenHash(hash) {
  if (!hash || hash === ZERO_HASH) return "";
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function evidenceCommitment(uri) {
  const trimmed = (uri || "").trim();
  if (!trimmed) return ZERO_HASH;
  return ethers.keccak256(ethers.toUtf8Bytes(trimmed));
}

function ArtifactTile({ tokenId, artifact, onClick }) {
  const gateway = ipfsUriToGateway(artifact.metadataURI);
  const badgeClass = artifact.isPrivate ? "pill pill-warning" : "pill pill-success";
  const badgeText = artifact.isPrivate ? "Hidden" : "Public";
  const title = artifact.isPrivate ? "Hidden" : artifact.artifactName || "(untitled)";
  const verifiedCount = (artifact.existenceAttestedAt ? 1 : 0) + (artifact.possessionAttestedAt ? 1 : 0);

  return (
    <button type="button" className="artifact-tile" onClick={onClick}>
      <div className="artifact-tile-thumb">
        {gateway ? <img src={gateway} alt={title} /> : <div className="artifact-tile-empty">No image</div>}
      </div>
      <div className="artifact-tile-body">
        <div className="artifact-tile-row">
          <strong className="artifact-tile-title">{title}</strong>
          <span className={badgeClass}>{badgeText}</span>
        </div>
        <div className="artifact-tile-sub">
          <span>Token #{String(tokenId)}</span>
          <span>
            {verifiedCount}/2 evidence on file
          </span>
        </div>
      </div>
    </button>
  );
}

function EvidenceRow({ label, commitment, attestedAt }) {
  const ts = formatTimestamp(attestedAt);
  const present = commitment && commitment !== ZERO_HASH;
  return (
    <div className="evidence-row">
      <span className="evidence-label">{label}</span>
      {present ? (
        <span className="evidence-meta">
          <span className="pill pill-success">On file</span>
          <code title={commitment}>{shortenHash(commitment)}</code>
          {ts && <span className="evidence-ts">{ts}</span>}
        </span>
      ) : (
        <span className="evidence-meta">
          <span className="pill pill-warning">No evidence</span>
        </span>
      )}
    </div>
  );
}

function ArtifactEditModal({
  open,
  tokenId,
  artifact,
  busy,
  onClose,
  onSaveMetadata,
  onTogglePrivacy,
  onSubmitEvidence,
}) {
  const [artifactName, setArtifactName] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [existenceUri, setExistenceUri] = useState("");
  const [possessionUri, setPossessionUri] = useState("");

  useEffect(() => {
    if (!open || !artifact) return;
    setArtifactName(artifact.artifactName || "");
    setMetadataURI(artifact.metadataURI || "");
    setExistenceUri("");
    setPossessionUri("");
  }, [open, artifact]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !artifact) return null;

  const gateway = ipfsUriToGateway(metadataURI);

  return (
    <div className="artifact-modal-root" role="dialog" aria-modal="true" aria-labelledby="artifact-modal-title">
      <div className="artifact-modal-backdrop" onClick={onClose} />
      <div className="artifact-modal-panel">
        <div className="artifact-modal-header">
          <h2 id="artifact-modal-title">Edit Artifact #{tokenId}</h2>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Close
          </button>
        </div>

        <div className="artifact-modal-preview">
          {gateway ? <img src={gateway} alt={artifactName || `Token ${tokenId}`} /> : <div className="artifact-tile-empty">No image</div>}
        </div>

        <div className="artifact-modal-grid">
          <section className="card">
            <h3>Metadata</h3>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                onSaveMetadata(tokenId, artifactName.trim(), metadataURI.trim());
              }}
            >
              <label>
                Artifact name
                <input
                  type="text"
                  value={artifactName}
                  onChange={(e) => setArtifactName(e.target.value)}
                  maxLength={120}
                  disabled={busy}
                />
              </label>
              <label>
                Metadata URI
                <input type="text" value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} disabled={busy} />
              </label>
              <div className="row">
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "Working..." : "Save metadata"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onTogglePrivacy(tokenId, !artifact.isPrivate)}
                  disabled={busy}
                >
                  {artifact.isPrivate ? "Show in default view" : "Hide from default view"}
                </button>
              </div>
              <p className="hint">
                "Hide from default view" only redacts the convenience read; on-chain storage, calldata, and the IPFS
                object remain readable to anyone willing to look.
              </p>
            </form>
          </section>

          <section className="card">
            <h3>Verification evidence</h3>
            <div className="evidence-summary">
              <EvidenceRow
                label="Existence"
                commitment={artifact.existenceCommitment}
                attestedAt={artifact.existenceAttestedAt}
              />
              <EvidenceRow
                label="Possession"
                commitment={artifact.possessionCommitment}
                attestedAt={artifact.possessionAttestedAt}
              />
            </div>

            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitEvidence(tokenId, "existence", existenceUri.trim());
              }}
            >
              <label>
                New existence evidence (URL or IPFS CID)
                <input
                  type="text"
                  value={existenceUri}
                  onChange={(e) => setExistenceUri(e.target.value)}
                  placeholder="ipfs://Qm... or https://..."
                  required
                  disabled={busy}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Submit existence evidence
              </button>
            </form>

            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitEvidence(tokenId, "possession", possessionUri.trim());
              }}
            >
              <label>
                New possession evidence (URL or IPFS CID)
                <input
                  type="text"
                  value={possessionUri}
                  onChange={(e) => setPossessionUri(e.target.value)}
                  placeholder="ipfs://Qm... or https://..."
                  required
                  disabled={busy}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Submit possession evidence
              </button>
            </form>

            <p className="hint">
              Submitting attaches a keccak256 commitment of your URL on-chain plus the URL itself in the event log
              (cheap to read off-chain). Transferring the artifact resets both commitments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function MyArtifactsPage() {
  const { account, provider, isConnected, isCorrectNetwork, getSigner } = useWallet();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tokenIds, setTokenIds] = useState([]);
  const [artifacts, setArtifacts] = useState({});
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  const ordered = useMemo(
    () => tokenIds.map((id) => ({ tokenId: id, artifact: artifacts[id] })).filter((x) => x.artifact),
    [tokenIds, artifacts]
  );

  const selectedArtifact = selectedTokenId != null ? artifacts[selectedTokenId] : null;

  async function refreshArtifacts() {
    if (!account || !provider || !hasContractAddress()) return;
    const c = getReadonlyContract(provider);
    const ids = await c.tokensOfOwner(account);
    const normalized = ids.map((x) => Number(x));
    setTokenIds(normalized);

    const entries = await Promise.all(
      normalized.map(async (id) => {
        const priv = await c.getPrivateArtifact(id);
        return [
          id,
          {
            artifactName: priv.artifactName,
            metadataURI: priv.metadataURI,
            isPrivate: Boolean(priv.isPrivate),
            createdAt: Number(priv.createdAt),
            existenceCommitment: priv.existenceCommitment,
            existenceAttestedAt: Number(priv.existenceAttestedAt),
            possessionCommitment: priv.possessionCommitment,
            possessionAttestedAt: Number(priv.possessionAttestedAt),
          },
        ];
      })
    );
    setArtifacts(Object.fromEntries(entries));
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!account || !provider) return;
      if (!hasContractAddress()) return;
      setLoading(true);
      try {
        await refreshArtifacts();
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.shortMessage || err?.message || "Could not load your artifacts.");
          setTokenIds([]);
          setArtifacts({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [account, provider, toast]);

  async function withWrite(action) {
    if (!isConnected || !isCorrectNetwork || !hasContractAddress()) {
      toast.error("Connect to Sepolia with the contract address configured.");
      return;
    }
    setBusy(true);
    try {
      const c = await getWritableContract(getSigner);
      await action(c);
      await refreshArtifacts();
    } catch (err) {
      toast.error(err?.shortMessage || err?.message || "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveMetadata(tokenId, name, uri) {
    await withWrite(async (c) => {
      const tx = await c.updateArtifactMetadata(tokenId, name, uri);
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success("Metadata updated.");
    });
  }

  async function handleTogglePrivacy(tokenId, nextPrivate) {
    await withWrite(async (c) => {
      const tx = await c.togglePrivacy(tokenId, nextPrivate);
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success(nextPrivate ? "Artifact hidden from default view." : "Artifact shown in default view.");
    });
  }

  async function handleSubmitEvidence(tokenId, kind, evidenceUri) {
    if (!evidenceUri) {
      toast.error("Provide an evidence URL or CID.");
      return;
    }
    const commitment = evidenceCommitment(evidenceUri);
    await withWrite(async (c) => {
      const tx =
        kind === "existence"
          ? await c.submitExistenceEvidence(tokenId, commitment, evidenceUri)
          : await c.submitPossessionEvidence(tokenId, commitment, evidenceUri);
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success(`${kind === "existence" ? "Existence" : "Possession"} evidence anchored.`);
      console.info(explorerTxUrl(tx.hash));
    });
  }

  return (
    <div className="page">
      <ArtifactEditModal
        open={selectedTokenId != null}
        tokenId={selectedTokenId}
        artifact={selectedArtifact}
        busy={busy}
        onClose={() => setSelectedTokenId(null)}
        onSaveMetadata={handleSaveMetadata}
        onTogglePrivacy={handleTogglePrivacy}
        onSubmitEvidence={handleSubmitEvidence}
      />

      <header className="page-header">
        <h1>My Artifacts</h1>
        <p className="page-sub">A gallery of every artifact tied to your wallet. Click one to edit in place.</p>
      </header>

      {!hasContractAddress() && (
        <p className="warning-banner">
          Set <code>VITE_CONTRACT_ADDRESS</code> to view your artifacts.
        </p>
      )}

      <section className="card">
        <div className="my-artifacts-header-row">
          <div className="my-artifacts-count">
            <strong>{loading ? "Loading…" : `${tokenIds.length}`}</strong> artifacts
          </div>
          <div className="row">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/app/mint")}>
              Mint a new artifact
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => selectedTokenId && navigate(`/app/artifacts/${selectedTokenId}`)}
              disabled={selectedTokenId == null}
            >
              Open full detail page
            </button>
          </div>
        </div>

        {tokenIds.length === 0 && !loading ? (
          <p className="hint">No artifacts found for this wallet yet. Mint one to begin your collection.</p>
        ) : (
          <div className="artifact-gallery">
            {ordered.map(({ tokenId, artifact }) => (
              <ArtifactTile key={tokenId} tokenId={tokenId} artifact={artifact} onClick={() => setSelectedTokenId(tokenId)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
