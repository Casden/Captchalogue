import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import {
  explorerTxUrl,
  explorerTokenUrl,
  getReadonlyContract,
  getWritableContract,
  hasContractAddress,
} from "../lib/contract";
import { ipfsUriToGateway } from "../lib/ipfs";

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

function toNumber(value) {
  try {
    return Number(value);
  } catch {
    return NaN;
  }
}

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

function EvidenceSummary({ label, commitment, attestedAt }) {
  const present = commitment && commitment !== ZERO_HASH;
  const ts = formatTimestamp(attestedAt);
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

export default function ArtifactDetailPage() {
  const { tokenId: tokenIdParam } = useParams();
  const tokenId = useMemo(() => String(tokenIdParam || ""), [tokenIdParam]);
  const numericTokenId = useMemo(() => toNumber(tokenId), [tokenId]);

  const { provider, getSigner, isConnected, isCorrectNetwork, account } = useWallet();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [data, setData] = useState(null);
  const [artifactName, setArtifactName] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [existenceUri, setExistenceUri] = useState("");
  const [possessionUri, setPossessionUri] = useState("");

  const gateway = ipfsUriToGateway(metadataURI);

  async function loadArtifact() {
    if (!provider) return;
    if (!hasContractAddress()) return;
    if (!numericTokenId || Number.isNaN(numericTokenId) || numericTokenId < 1) return;
    setLoading(true);
    try {
      const c = getReadonlyContract(provider);
      const priv = await c.getPrivateArtifact(numericTokenId);
      const owner = await c.ownerOf(numericTokenId);

      const parsed = {
        owner,
        artifactName: priv.artifactName,
        metadataURI: priv.metadataURI,
        isPrivate: Boolean(priv.isPrivate),
        createdAt: Number(priv.createdAt),
        existenceCommitment: priv.existenceCommitment,
        existenceAttestedAt: Number(priv.existenceAttestedAt),
        possessionCommitment: priv.possessionCommitment,
        possessionAttestedAt: Number(priv.possessionAttestedAt),
      };
      setData(parsed);
      setArtifactName(parsed.artifactName || "");
      setMetadataURI(parsed.metadataURI || "");
      setIsPrivate(parsed.isPrivate);
    } catch (err) {
      toast.error(err?.shortMessage || err?.message || "Could not load artifact.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadArtifact();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, numericTokenId]);

  const canWrite = isConnected && isCorrectNetwork && hasContractAddress();
  const isOwner = data?.owner && account && data.owner.toLowerCase() === account.toLowerCase();

  async function withWrite(action) {
    if (!canWrite) {
      toast.error("Connect to Sepolia with the contract address configured.");
      return;
    }
    if (!isOwner) {
      toast.error("Only the token owner can modify this artifact.");
      return;
    }
    setBusy(true);
    try {
      const c = await getWritableContract(getSigner);
      await action(c);
      await loadArtifact();
    } catch (err) {
      toast.error(err?.shortMessage || err?.message || "Transaction failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveMetadata(e) {
    e.preventDefault();
    await withWrite(async (c) => {
      const tx = await c.updateArtifactMetadata(numericTokenId, artifactName.trim(), metadataURI.trim());
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success("Metadata updated.");
    });
  }

  async function togglePrivacy(nextPrivate) {
    await withWrite(async (c) => {
      const tx = await c.togglePrivacy(numericTokenId, nextPrivate);
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success(nextPrivate ? "Artifact hidden from default view." : "Artifact shown in default view.");
      setIsPrivate(nextPrivate);
    });
  }

  async function submitEvidence(kind, uri) {
    if (!uri) {
      toast.error("Provide an evidence URL or CID.");
      return;
    }
    const commitment = evidenceCommitment(uri);
    await withWrite(async (c) => {
      const tx =
        kind === "existence"
          ? await c.submitExistenceEvidence(numericTokenId, commitment, uri)
          : await c.submitPossessionEvidence(numericTokenId, commitment, uri);
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success(`${kind === "existence" ? "Existence" : "Possession"} evidence anchored.`);
      console.info(explorerTxUrl(tx.hash));
      if (kind === "existence") setExistenceUri("");
      else setPossessionUri("");
    });
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="detail-header-row">
          <div>
            <h1>Artifact #{tokenId}</h1>
            <p className="page-sub">Manage metadata, default-view visibility, and verification evidence for an artifact you own.</p>
          </div>
          <div className="row">
            <Link className="btn btn-secondary" to="/app/artifacts">
              Back to My Artifacts
            </Link>
            <a className="btn btn-secondary" href={explorerTokenUrl(tokenId)} target="_blank" rel="noreferrer">
              View on Etherscan
            </a>
          </div>
        </div>
      </header>

      {!hasContractAddress() && (
        <p className="warning-banner">
          Set <code>VITE_CONTRACT_ADDRESS</code> to manage your artifacts.
        </p>
      )}

      {loading ? (
        <section className="card">
          <p className="hint">Loading artifact…</p>
        </section>
      ) : !data ? (
        <section className="card">
          <p className="hint">Could not load this artifact. Make sure the token exists and you are its owner.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate("/app/artifacts")}>
            Return
          </button>
        </section>
      ) : (
        <div className="grid two-col">
          <section className="card">
            <h2>Preview</h2>
            <div className="artifact-detail-preview">
              {gateway ? <img src={gateway} alt={artifactName || `Token ${tokenId}`} /> : <div className="artifact-tile-empty">No image</div>}
            </div>
            <div className="artifact-detail-meta">
              <span className={`pill ${isPrivate ? "pill-warning" : "pill-success"}`}>{isPrivate ? "Hidden" : "Public"}</span>
              {data.createdAt > 0 && (
                <span className="pill pill-success">Created {formatTimestamp(data.createdAt)}</span>
              )}
            </div>
            <p className="hint">
              Owner: <code>{data.owner}</code>
            </p>
            <div className="evidence-summary">
              <EvidenceSummary
                label="Existence"
                commitment={data.existenceCommitment}
                attestedAt={data.existenceAttestedAt}
              />
              <EvidenceSummary
                label="Possession"
                commitment={data.possessionCommitment}
                attestedAt={data.possessionAttestedAt}
              />
            </div>
          </section>

          <section className="card">
            <h2>Edit metadata</h2>
            <form className="form" onSubmit={saveMetadata}>
              <label>
                Artifact name
                <input
                  type="text"
                  value={artifactName}
                  onChange={(e) => setArtifactName(e.target.value)}
                  maxLength={120}
                  disabled={!isOwner || busy}
                />
              </label>
              <label>
                Metadata URI (image / IPFS URI)
                <input type="text" value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} disabled={!isOwner || busy} />
              </label>

              <div className="row">
                <button type="submit" className="btn btn-primary" disabled={!isOwner || busy}>
                  {busy ? "Saving..." : "Save metadata"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => togglePrivacy(!isPrivate)}
                  disabled={!isOwner || busy}
                >
                  {isPrivate ? "Show in default view" : "Hide from default view"}
                </button>
              </div>
              <p className="hint">
                Hiding only redacts the convenience read; on-chain storage and the IPFS object stay readable.
              </p>
            </form>
          </section>

          <section className="card">
            <h2>Submit existence evidence</h2>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                submitEvidence("existence", existenceUri.trim());
              }}
            >
              <label>
                Evidence URL or IPFS CID
                <input
                  type="text"
                  value={existenceUri}
                  onChange={(e) => setExistenceUri(e.target.value)}
                  placeholder="ipfs://Qm... or https://..."
                  required
                  disabled={!isOwner || busy}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={!isOwner || busy}>
                Submit existence
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Submit possession evidence</h2>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                submitEvidence("possession", possessionUri.trim());
              }}
            >
              <label>
                Evidence URL or IPFS CID
                <input
                  type="text"
                  value={possessionUri}
                  onChange={(e) => setPossessionUri(e.target.value)}
                  placeholder="ipfs://Qm... or https://..."
                  required
                  disabled={!isOwner || busy}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={!isOwner || busy}>
                Submit possession
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
