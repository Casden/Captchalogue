import { useMemo, useState } from "react";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import { explorerTxUrl, getWritableContract, hasContractAddress } from "../lib/contract";
import { uploadFile } from "../lib/ipfs";
import { removeImageBackground } from "../lib/bgRemoval";
import ImageDropzone from "../components/ImageDropzone";
import MintCeremonyOverlay from "../components/MintCeremonyOverlay";

function buildCeremonySteps(useManualUri, shouldRemoveBg) {
  const steps = [{ id: "warmup", label: "Warming up...", status: "pending" }];
  if (!useManualUri && shouldRemoveBg) {
    steps.push({ id: "bg", label: "Removing image background", status: "pending" });
  }
  steps.push({
    id: "ipfs",
    label: useManualUri ? "Resolve your metadata URI" : "Pin your artwork to IPFS",
    status: "pending",
  });
  steps.push({ id: "sign", label: "Sign the mint with your wallet", status: "pending" });
  steps.push({ id: "chain", label: "Anchor the artifact on Sepolia", status: "pending" });
  return steps;
}

function markStep(steps, id, status) {
  return steps.map((s) => (s.id === id ? { ...s, status } : s));
}

function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

export default function MintPage() {
  const { isCorrectNetwork, isConnected, getSigner } = useWallet();
  const toast = useToast();

  const [artifactName, setArtifactName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [removeBg, setRemoveBg] = useState(true);
  const [manualUri, setManualUri] = useState("");
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const [lastMint, setLastMint] = useState(null);

  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [ceremonyPhase, setCeremonyPhase] = useState(null);
  const [ceremonySteps, setCeremonySteps] = useState([]);
  const [ceremonyError, setCeremonyError] = useState(null);
  const [ceremonySuccess, setCeremonySuccess] = useState(null);

  const isMinting = ceremonyPhase === "minting";

  const hasAsset = manualOverride ? manualUri.trim().length > 0 : Boolean(imageFile);

  const ready =
    isConnected &&
    isCorrectNetwork &&
    hasContractAddress() &&
    artifactName.trim().length > 0 &&
    hasAsset &&
    !isMinting;

  const metadataPreview = useMemo(() => {
    if (manualOverride) return manualUri.trim() || "(paste a URI)";
    if (imageFile) return "(pinned when you mint)";
    return "(choose an image)";
  }, [manualOverride, manualUri, imageFile]);

  function resetAfterSuccess() {
    setArtifactName("");
    setIsPrivate(false);
    setManualUri("");
    setImageFile(null);
    setDropzoneKey((k) => k + 1);
  }

  function closeCeremony() {
    setCeremonyOpen(false);
    setCeremonyPhase(null);
    setCeremonySteps([]);
    setCeremonyError(null);
    setCeremonySuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ready) return;

    const steps = buildCeremonySteps(manualOverride, removeBg);
    const firstStepId = steps[0]?.id;
    const preparedSteps = firstStepId ? markStep(steps, firstStepId, "active") : steps;
    setCeremonySteps(preparedSteps);
    setCeremonyError(null);
    setCeremonySuccess(null);
    setCeremonyPhase("minting");
    setCeremonyOpen(true);

    const setStep = (id, status) => {
      setCeremonySteps((prev) => markStep(prev, id, status));
    };

    let ipfsMeta = null;

    try {
      // Let the overlay, GIF, and spinner render before heavy async work starts.
      await nextPaint();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStep("warmup", "complete");
      if (steps[1]?.id) setStep(steps[1].id, "active");

      let tokenUri = "";

      if (manualOverride) {
        tokenUri = manualUri.trim();
        await new Promise((r) => setTimeout(r, 120));
        setStep("ipfs", "complete");
      } else {
        let uploadTarget = imageFile;
        if (removeBg) {
          try {
            uploadTarget = await removeImageBackground(imageFile);
            setStep("bg", "complete");
            setStep("ipfs", "active");
          } catch (bgErr) {
            throw new Error(
              bgErr?.message ||
                "Background removal failed. Try again, or disable background removal and mint with the original image."
            );
          }
        }
        const uploaded = await uploadFile(uploadTarget);
        tokenUri = uploaded.uri;
        ipfsMeta = { cid: uploaded.cid, gatewayUrl: uploaded.gatewayUrl };
        setStep("ipfs", "complete");
      }

      setStep("sign", "active");
      const contract = await getWritableContract(getSigner);
      const tx = await contract.createArtifact(artifactName.trim(), tokenUri, isPrivate);
      toast.info(`Mint transaction sent: ${tx.hash.slice(0, 10)}…`);
      setStep("sign", "complete");

      setStep("chain", "active");
      const receipt = await tx.wait();
      setStep("chain", "complete");

      setLastMint({ hash: tx.hash, blockNumber: receipt?.blockNumber });
      toast.success("Artifact minted successfully.");

      setCeremonySuccess({
        artifactName: artifactName.trim(),
        cid: ipfsMeta?.cid,
        gatewayUrl: ipfsMeta?.gatewayUrl,
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
        txUrl: explorerTxUrl(tx.hash),
      });
      setCeremonyPhase("success");
      resetAfterSuccess();
    } catch (err) {
      const msg = err?.shortMessage || err?.message || "Mint failed.";
      setCeremonyError(msg);
      setCeremonyPhase("error");
      setCeremonySteps((prev) =>
        prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s))
      );
      toast.error(msg);
    }
  }

  return (
    <div className="page">
      <MintCeremonyOverlay
        open={ceremonyOpen}
        phase={ceremonyPhase}
        artifactName={artifactName}
        steps={ceremonySteps}
        errorMessage={ceremonyError}
        successMeta={ceremonySuccess}
        onClose={closeCeremony}
      />

      <header className="page-header">
        <h1>Mint Artifact</h1>
        <p className="page-sub">
          Choose an image and name your piece — when you mint, it is pinned to IPFS and inscribed on Sepolia in one
          ceremony.
        </p>
      </header>

      <div className="grid two-col">
        <section className="card">
          <h2>Artifact Image</h2>
          <ImageDropzone
            key={dropzoneKey}
            onFileSelected={(file) => setImageFile(file)}
            onError={(message) => toast.error(message)}
            disabled={isMinting || manualOverride}
          />
          <div className="advanced-toggle">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(e) => {
                  setManualOverride(e.target.checked);
                  if (e.target.checked) setImageFile(null);
                }}
                disabled={isMinting}
              />
              Advanced: paste URI manually
            </label>
            {manualOverride && (
              <input
                type="text"
                placeholder="ipfs://... or https://..."
                value={manualUri}
                onChange={(e) => setManualUri(e.target.value)}
                disabled={isMinting}
              />
            )}
            {!manualOverride && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={removeBg}
                  onChange={(e) => setRemoveBg(e.target.checked)}
                  disabled={isMinting}
                />
                Remove image background automatically (first use downloads a model)
              </label>
            )}
          </div>
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
                disabled={isMinting}
              />
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={isMinting}
              />
              Hide from default view (name + URI still readable on-chain)
            </label>

            <div className="readonly-field">
              <span className="readonly-label">Token URI</span>
              <code className="readonly-value">{metadataPreview}</code>
            </div>

            <button type="submit" className="btn btn-primary" disabled={!ready}>
              {isMinting ? "Minting…" : "Mint Artifact"}
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
