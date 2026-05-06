import { CONTRACT_ADDRESS, explorerTokenUrl } from "../lib/contract";
import { ipfsUriToGateway } from "../lib/ipfs";

const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function shortHash(hash) {
  if (!hash || hash === ZERO_HASH) return null;
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

function HashRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="captcha-card-meta-row">
      <span>{label}</span>
      <code title={value}>{shortHash(value)}</code>
    </div>
  );
}

export default function CaptchalogueCard({ tokenId, artifact, onClick }) {
  const imageSrc = ipfsUriToGateway(artifact.metadataURI);
  const title = artifact.isPrivate ? "Hidden in default view" : artifact.artifactName || "(untitled)";

  return (
    <button type="button" className="captcha-card" onClick={onClick}>
      <span className="sr-only">Flip card to see blockchain details</span>
      <span className="captcha-card-inner">
        <span className="captcha-card-face captcha-card-front">
          <span className="captcha-card-front-media">
            {imageSrc ? (
              <img src={imageSrc} alt={title} />
            ) : (
              <span className="captcha-card-empty">No image</span>
            )}
          </span>
        </span>

        <span className="captcha-card-face captcha-card-back">
          <span className="captcha-card-back-title">TOKEN #{String(tokenId)}</span>
          <div className="captcha-card-meta-row">
            <span>Name</span>
            <code title={title}>{title}</code>
          </div>
          <div className="captcha-card-meta-row">
            <span>Contract</span>
            <code title={CONTRACT_ADDRESS}>{shortAddress(CONTRACT_ADDRESS)}</code>
          </div>
          <HashRow label="Existence" value={artifact.existenceCommitment} />
          <HashRow label="Possession" value={artifact.possessionCommitment} />
          <a
            className="captcha-card-link"
            href={explorerTokenUrl(tokenId)}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            View on Etherscan
          </a>
        </span>
      </span>
    </button>
  );
}
