import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import {
  explorerTxUrl,
  getReadonlyContract,
  getWritableContract,
  hasContractAddress,
} from "../lib/contract";
import CaptchalogueCard from "../components/CaptchalogueCard";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function TransferPage() {
  const { account, provider, isConnected, isCorrectNetwork, getSigner } = useWallet();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFromUrl = searchParams.get("tokenId");

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tokenIds, setTokenIds] = useState([]);
  const [artifacts, setArtifacts] = useState({});
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [confirming, setConfirming] = useState(false);

  const ordered = useMemo(
    () => tokenIds.map((id) => ({ tokenId: id, artifact: artifacts[id] })).filter((x) => x.artifact),
    [tokenIds, artifacts]
  );

  const selectedArtifact = selectedTokenId != null ? artifacts[selectedTokenId] : null;

  const recipientTrimmed = recipient.trim();
  const recipientIsValidAddress = ethers.isAddress(recipientTrimmed);
  const recipientChecksummed = recipientIsValidAddress ? ethers.getAddress(recipientTrimmed) : "";
  const recipientIsZero = recipientIsValidAddress && recipientChecksummed === ZERO_ADDRESS;
  const recipientIsSelf =
    recipientIsValidAddress &&
    account &&
    recipientChecksummed.toLowerCase() === account.toLowerCase();

  let validationMessage = "";
  if (!hasContractAddress()) {
    validationMessage = "Set VITE_CONTRACT_ADDRESS to enable transfers.";
  } else if (!isConnected) {
    validationMessage = "Connect your wallet first.";
  } else if (!isCorrectNetwork) {
    validationMessage = "Switch to Sepolia first.";
  } else if (selectedTokenId == null) {
    validationMessage = "Pick an artifact to transfer.";
  } else if (!recipientTrimmed) {
    validationMessage = "Enter a recipient address.";
  } else if (!recipientIsValidAddress) {
    validationMessage = "That doesn't look like a valid Ethereum address.";
  } else if (recipientIsZero) {
    validationMessage = "Cannot transfer to the zero address.";
  } else if (recipientIsSelf) {
    validationMessage = "Cannot transfer to yourself.";
  }

  const canTransfer = !validationMessage && !busy;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!account || !provider) return;
      if (!hasContractAddress()) return;
      setLoading(true);
      try {
        const readContract = getReadonlyContract(provider);
        const ownerContract = await getWritableContract(getSigner);
        const ids = await readContract.tokensOfOwner(account);
        const normalized = ids.map((x) => Number(x));
        if (cancelled) return;
        setTokenIds(normalized);

        const entries = await Promise.all(
          normalized.map(async (id) => {
            const priv = await ownerContract.getPrivateArtifact(id);
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
        if (cancelled) return;
        setArtifacts(Object.fromEntries(entries));
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
  }, [account, provider, toast, getSigner]);

  // Once we know the owned token list, honor the ?tokenId= preselect (if it's actually owned),
  // otherwise default to the first owned token.
  useEffect(() => {
    if (tokenIds.length === 0) {
      setSelectedTokenId(null);
      return;
    }
    if (selectedTokenId != null && tokenIds.includes(selectedTokenId)) return;

    const fromUrl = preselectedFromUrl != null ? Number(preselectedFromUrl) : NaN;
    if (Number.isFinite(fromUrl) && tokenIds.includes(fromUrl)) {
      setSelectedTokenId(fromUrl);
    } else {
      setSelectedTokenId(tokenIds[0]);
    }
  }, [tokenIds, preselectedFromUrl, selectedTokenId]);

  // Any change to the selection or recipient invalidates the in-progress confirmation.
  useEffect(() => {
    setConfirming(false);
  }, [selectedTokenId, recipient]);

  function handleStart(event) {
    event.preventDefault();
    if (!canTransfer) return;
    setConfirming(true);
  }

  async function handleConfirmTransfer() {
    if (!canTransfer || selectedTokenId == null) return;
    setBusy(true);
    try {
      const c = await getWritableContract(getSigner);
      const to = ethers.getAddress(recipientTrimmed);
      const tx = await c["safeTransferFrom(address,address,uint256)"](
        account,
        to,
        selectedTokenId
      );
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success(`Artifact #${selectedTokenId} transferred to ${shorten(to)}.`);
      console.info(explorerTxUrl(tx.hash));
      navigate("/app/artifacts");
    } catch (err) {
      toast.error(err?.shortMessage || err?.message || "Transfer failed.");
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Transfer</h1>
        <p className="page-sub">
          Send an artifact you own to another wallet. Transferring resets both verification commitments,
          so the new owner can re-attest on their own terms.
        </p>
      </header>

      {!hasContractAddress() && (
        <p className="warning-banner">
          Set <code>VITE_CONTRACT_ADDRESS</code> to enable transfers.
        </p>
      )}

      <section className="card">
        <h2>Pick an artifact</h2>
        {loading ? (
          <p className="hint">Loading your artifacts...</p>
        ) : tokenIds.length === 0 ? (
          <p className="hint">
            No artifacts found for this wallet. Mint one first, then come back here to transfer it.
          </p>
        ) : (
          <form className="form" onSubmit={handleStart}>
            <label>
              Artifact
              <select
                value={selectedTokenId ?? ""}
                onChange={(e) => setSelectedTokenId(Number(e.target.value))}
                disabled={busy}
              >
                {ordered.map(({ tokenId, artifact }) => {
                  const label = artifact.isPrivate
                    ? "Hidden in default view"
                    : artifact.artifactName || "(untitled)";
                  return (
                    <option key={tokenId} value={tokenId}>
                      #{tokenId} — {label}
                    </option>
                  );
                })}
              </select>
            </label>

            {selectedArtifact && (
              <div className="transfer-preview">
                <CaptchalogueCard
                  tokenId={selectedTokenId}
                  artifact={selectedArtifact}
                  interactive={false}
                />
              </div>
            )}

            <label>
              Recipient address
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                disabled={busy}
              />
            </label>

            {recipientIsValidAddress && !recipientIsZero && !recipientIsSelf && (
              <p className="hint">
                Sending to <code>{recipientChecksummed}</code>
              </p>
            )}

            <p className="hint">
              From <code>{account}</code> ({shorten(account)})
            </p>

            {validationMessage && (
              <p className="warning-banner">{validationMessage}</p>
            )}

            {!confirming ? (
              <div className="row">
                <button type="submit" className="btn btn-primary" disabled={!canTransfer}>
                  Review transfer
                </button>
              </div>
            ) : (
              <div className="card transfer-confirm">
                <h3>Confirm transfer</h3>
                <ul className="transfer-confirm-list">
                  <li>
                    <span>Token</span>
                    <code>
                      #{selectedTokenId} —{" "}
                      {selectedArtifact?.isPrivate
                        ? "Hidden in default view"
                        : selectedArtifact?.artifactName || "(untitled)"}
                    </code>
                  </li>
                  <li>
                    <span>From</span>
                    <code title={account}>{account}</code>
                  </li>
                  <li>
                    <span>To</span>
                    <code title={recipientChecksummed}>{recipientChecksummed}</code>
                  </li>
                </ul>
                <p className="hint">
                  This will permanently transfer ownership and reset both existence and possession
                  evidence commitments. You will lose the ability to edit metadata or toggle privacy
                  for this artifact.
                </p>
                <div className="row">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmTransfer}
                    disabled={busy}
                  >
                    {busy ? "Transferring..." : "Confirm transfer"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
