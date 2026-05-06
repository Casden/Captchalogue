import { ipfsUriToGateway } from "../lib/ipfs";

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function shortenHash(hash) {
  if (!hash || hash === ZERO_HASH) return "";
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function formatTimestamp(unixSeconds) {
  if (!unixSeconds) return null;
  const n = Number(unixSeconds);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toLocaleString();
}

function EvidencePill({ label, commitment, attestedAt }) {
  const present = commitment && commitment !== ZERO_HASH;
  const ts = formatTimestamp(attestedAt);
  return (
    <div className="kv-evidence">
      <dt>{label}</dt>
      <dd>
        {present ? (
          <>
            <span className="pill pill-success">On file</span>
            <div className="kv-evidence-meta">
              <code title={commitment}>{shortenHash(commitment)}</code>
              {ts && <span>{ts}</span>}
            </div>
          </>
        ) : (
          <span className="pill pill-warning">No evidence</span>
        )}
      </dd>
    </div>
  );
}

export default function ArtifactCard({ tokenId, data }) {
  if (!data) return null;
  const gateway = ipfsUriToGateway(data.metadataURI);

  return (
    <div className="artifact-card">
      <div className="artifact-image">
        {data.isPrivate ? (
          <div className="artifact-private">Hidden in default view</div>
        ) : gateway ? (
          <img src={gateway} alt={data.artifactName || `Token ${tokenId}`} />
        ) : (
          <div className="artifact-empty">No image</div>
        )}
      </div>

      <div className="artifact-body">
        <div className="artifact-title-row">
          <h3>{data.artifactName || "(untitled)"}</h3>
          <span className={`pill ${data.isPrivate ? "pill-warning" : "pill-success"}`}>
            {data.isPrivate ? "Hidden" : "Public"}
          </span>
        </div>

        <dl className="kv">
          <div>
            <dt>Token ID</dt>
            <dd>{String(tokenId)}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd title={data.owner}>{shorten(data.owner)}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatTimestamp(data.createdAt) || "—"}</dd>
          </div>
          <EvidencePill
            label="Existence"
            commitment={data.existenceCommitment}
            attestedAt={data.existenceAttestedAt}
          />
          <EvidencePill
            label="Possession"
            commitment={data.possessionCommitment}
            attestedAt={data.possessionAttestedAt}
          />
        </dl>

        {!data.isPrivate && data.metadataURI && (
          <div className="artifact-uri">
            <code>{data.metadataURI}</code>
            <a href={gateway} target="_blank" rel="noreferrer" className="link">
              Open metadata
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
