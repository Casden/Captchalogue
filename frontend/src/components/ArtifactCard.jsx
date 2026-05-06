import { ipfsUriToGateway } from "../lib/ipfs";

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ArtifactCard({ tokenId, data }) {
  if (!data) return null;
  const gateway = ipfsUriToGateway(data.metadataURI);

  return (
    <div className="artifact-card">
      <div className="artifact-image">
        {data.isPrivate ? (
          <div className="artifact-private">Private artifact</div>
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
            {data.isPrivate ? "Private" : "Public"}
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
            <dt>Existence</dt>
            <dd>{data.existenceScore} / 50</dd>
          </div>
          <div>
            <dt>Possession</dt>
            <dd>{data.possessionScore} / 50</dd>
          </div>
          <div>
            <dt>Total score</dt>
            <dd>
              <strong>{data.totalScore} / 100</strong>
            </dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{new Date(data.createdAt * 1000).toLocaleString()}</dd>
          </div>
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
