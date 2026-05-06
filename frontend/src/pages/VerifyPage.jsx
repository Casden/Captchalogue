import { useState } from "react";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import { explorerTxUrl, getWritableContract, hasContractAddress } from "../lib/contract";

function ScoreForm({ kind, label, busy, onSubmit }) {
  const [tokenId, setTokenId] = useState("1");
  const [evidenceHash, setEvidenceHash] = useState("");
  const [score, setScore] = useState(25);

  async function handle(e) {
    e.preventDefault();
    await onSubmit({ tokenId, evidenceHash: evidenceHash.trim(), score });
  }

  return (
    <section className="card">
      <h2>{label}</h2>
      <form className="form" onSubmit={handle}>
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

        <label>
          Evidence hash or note
          <input
            type="text"
            value={evidenceHash}
            onChange={(e) => setEvidenceHash(e.target.value)}
            placeholder="ipfs://... or sha256:..."
            required
          />
        </label>

        <label>
          Claimed score: <strong>{score}</strong> / 50
          <input
            type="range"
            min="0"
            max="50"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Submitting..." : `Submit ${kind}`}
        </button>
      </form>
    </section>
  );
}

export default function VerifyPage() {
  const { isCorrectNetwork, isConnected, getSigner } = useWallet();
  const toast = useToast();
  const [busyKind, setBusyKind] = useState(null);

  function ready() {
    if (!isConnected || !isCorrectNetwork || !hasContractAddress()) {
      toast.error("Connect to Sepolia with the contract address configured.");
      return false;
    }
    return true;
  }

  async function submit(kind, { tokenId, evidenceHash, score }) {
    if (!ready()) return;
    setBusyKind(kind);
    try {
      const contract = await getWritableContract(getSigner);
      const fn =
        kind === "existence"
          ? contract.submitExistenceAttestation
          : contract.submitPossessionAttestation;
      const tx = await fn(tokenId, evidenceHash, score);
      toast.info(`Transaction sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      toast.success(`${kind === "existence" ? "Existence" : "Possession"} attestation recorded.`, {
        duration: 5500,
      });
      console.info(explorerTxUrl(tx.hash));
    } catch (err) {
      toast.error(err?.shortMessage || err?.message || "Attestation failed.");
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Verify</h1>
        <p className="page-sub">
          Submit attestation evidence and score for either half of the verification model. You can only
          attest for tokens you own.
        </p>
      </header>

      <div className="grid two-col">
        <ScoreForm
          kind="existence"
          label="Existence Attestation (0-50)"
          busy={busyKind === "existence"}
          onSubmit={(payload) => submit("existence", payload)}
        />
        <ScoreForm
          kind="possession"
          label="Possession Attestation (0-50)"
          busy={busyKind === "possession"}
          onSubmit={(payload) => submit("possession", payload)}
        />
      </div>
    </div>
  );
}
