import { useEffect } from "react";

export default function MintCeremonyOverlay({
  open,
  phase,
  artifactName,
  steps,
  errorMessage,
  successMeta,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const isError = phase === "error";
  const isSuccess = phase === "success";
  const isMinting = phase === "minting";
  const loadingAnimationUrl = `${import.meta.env.BASE_URL}assets/homestuck/animations/sburb_loading_animation.gif`;

  return (
    <div className="mint-ceremony-root" role="dialog" aria-modal="true" aria-labelledby="mint-ceremony-title">
      <div className="mint-ceremony-backdrop" />
      <div className={`mint-ceremony-panel ${isSuccess ? "mint-ceremony-panel-success" : ""}`}>
        <div className="mint-ceremony-glow" aria-hidden />

        <header className="mint-ceremony-header">
          <p className="mint-ceremony-kicker">Punch Designix</p>
          <h2 id="mint-ceremony-title">
            {isSuccess ? "Mint complete" : isError ? "Mint interrupted" : "Minting artifact"}
          </h2>
          {isSuccess && <p className="mint-ceremony-flavor">Card sylladexed, blockchain edition.</p>}
          {(successMeta?.artifactName || artifactName) && (
            <p className="mint-ceremony-sub">
              {isSuccess ? (
                <>
                  <strong>{successMeta?.artifactName || artifactName}</strong> now lives on-chain.
                </>
              ) : isError ? (
                "Something went wrong before the inscription was completed."
              ) : (
                <>
                  Sealing <strong>{artifactName}</strong> into Sepolia.
                </>
              )}
            </p>
          )}
        </header>

        {isMinting && (
          <div className="mint-ceremony-animation-wrap">
            <div
              className="mint-ceremony-animation mint-ceremony-animation-gif"
              aria-hidden="true"
              style={{ "--mint-loader-gif": `url("${loadingAnimationUrl}")` }}
            />
          </div>
        )}

        <ol className="mint-ceremony-steps">
          {steps.map((step, i) => (
            <li
              key={step.id}
              className={`mint-ceremony-step mint-ceremony-step-${step.status}`}
            >
              <span className="mint-ceremony-step-index" aria-hidden>
                {step.status === "complete" ? (
                  <span className="mint-ceremony-check">✓</span>
                ) : step.status === "error" ? (
                  <span className="mint-ceremony-x">!</span>
                ) : step.status === "active" ? (
                  <span className="mint-ceremony-spinner" />
                ) : (
                  <span className="mint-ceremony-num">{i + 1}</span>
                )}
              </span>
              <span className="mint-ceremony-step-label">{step.label}</span>
            </li>
          ))}
        </ol>

        {errorMessage && isError && (
          <p className="mint-ceremony-error">{errorMessage}</p>
        )}

        {isSuccess && successMeta && (
          <div className="mint-ceremony-success-detail">
            {successMeta.cid && (
              <div className="mint-ceremony-row">
                <span>IPFS</span>
                <code title={successMeta.cid}>{successMeta.cid}</code>
              </div>
            )}
            {successMeta.gatewayUrl && (
              <a className="link" href={successMeta.gatewayUrl} target="_blank" rel="noreferrer">
                Open artwork on gateway
              </a>
            )}
            {successMeta.txUrl && (
              <a className="link" href={successMeta.txUrl} target="_blank" rel="noreferrer">
                View transaction on Etherscan
              </a>
            )}
            {successMeta.blockNumber != null && (
              <div className="mint-ceremony-row">
                <span>Block</span>
                <span>#{successMeta.blockNumber}</span>
              </div>
            )}
          </div>
        )}

        <footer className="mint-ceremony-footer">
          {(isError || isSuccess) && (
            <button type="button" className="btn btn-primary" onClick={onClose}>
              {isSuccess ? "Continue" : "Close"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
