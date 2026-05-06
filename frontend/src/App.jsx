import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI } from "./contractAbi";

const SEPOLIA_CHAIN_ID = 11155111;

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function parseError(error) {
  return (
    error?.reason ||
    error?.shortMessage ||
    error?.message ||
    "Transaction failed."
  );
}

export default function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState("Connect MetaMask to get started.");
  const [isBusy, setIsBusy] = useState(false);

  const [artifactName, setArtifactName] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [readTokenId, setReadTokenId] = useState("1");
  const [artifactData, setArtifactData] = useState(null);

  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";

  const isMetaMaskInstalled =
    typeof window !== "undefined" && typeof window.ethereum !== "undefined";
  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  const provider = useMemo(() => {
    if (!isMetaMaskInstalled) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, [isMetaMaskInstalled]);

  async function refreshWalletState() {
    if (!provider) return;
    const net = await provider.getNetwork();
    setChainId(Number(net.chainId));

    const accounts = await provider.send("eth_accounts", []);
    setAccount(accounts[0] || "");
  }

  useEffect(() => {
    if (!isMetaMaskInstalled) return;
    refreshWalletState().catch(() => {});

    const handleAccountsChanged = (accounts) => setAccount(accounts[0] || "");
    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [isMetaMaskInstalled, provider]);

  async function connectWallet() {
    try {
      if (!provider) throw new Error("MetaMask is not installed.");
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0] || "");
      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));
      setStatus("Wallet connected.");
    } catch (error) {
      setStatus(parseError(error));
    }
  }

  async function switchToSepolia() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
      setStatus("Switched to Sepolia.");
      await refreshWalletState();
    } catch (error) {
      setStatus(parseError(error));
    }
  }

  async function getWritableContract() {
    if (!provider) throw new Error("MetaMask is not installed.");
    if (!contractAddress) throw new Error("Missing VITE_CONTRACT_ADDRESS.");
    if (!isCorrectNetwork) throw new Error("Switch MetaMask to Sepolia.");
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  }

  async function getReadonlyContract() {
    if (!provider) throw new Error("MetaMask is not installed.");
    if (!contractAddress) throw new Error("Missing VITE_CONTRACT_ADDRESS.");
    return new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
  }

  async function handleCreateArtifact(e) {
    e.preventDefault();
    setIsBusy(true);
    try {
      const contract = await getWritableContract();
      const tx = await contract.createArtifact(
        artifactName.trim(),
        metadataUri.trim(),
        isPrivate
      );
      setStatus(`Mint transaction sent: ${tx.hash}`);
      await tx.wait();
      setStatus("Artifact minted successfully.");
      setArtifactName("");
      setMetadataUri("");
      setIsPrivate(false);
    } catch (error) {
      setStatus(parseError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReadArtifact(e) {
    e.preventDefault();
    setIsBusy(true);
    try {
      const contract = await getReadonlyContract();
      const data = await contract.getPublicArtifact(readTokenId);
      setArtifactData({
        owner: data.owner,
        artifactName: data.artifactName,
        metadataURI: data.metadataURI,
        isPrivate: data.isPrivate,
        existenceScore: Number(data.existenceScore),
        possessionScore: Number(data.possessionScore),
        totalScore: Number(data.totalScore),
        createdAt: Number(data.createdAt),
      });
      setStatus("Artifact loaded.");
    } catch (error) {
      setStatus(parseError(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="app">
      <h1>Captchalogue</h1>
      <p className="subtitle">
        Sepolia NFT Artifact DApp (MetaMask + Hardhat deployed contract)
      </p>

      <section className="card">
        <h2>Wallet</h2>
        <p>
          <strong>Status:</strong>{" "}
          {account ? `Connected ${shorten(account)}` : "Not connected"}
        </p>
        <p>
          <strong>Network:</strong>{" "}
          {chainId ? `${chainId}${isCorrectNetwork ? " (Sepolia)" : ""}` : "Unknown"}
        </p>
        <div className="row">
          <button onClick={connectWallet} disabled={isBusy || !isMetaMaskInstalled}>
            Connect MetaMask
          </button>
          <button onClick={switchToSepolia} disabled={isBusy || !isMetaMaskInstalled}>
            Switch to Sepolia
          </button>
        </div>
        {!contractAddress && (
          <p className="warning">
            Set <code>VITE_CONTRACT_ADDRESS</code> in frontend <code>.env</code>.
          </p>
        )}
      </section>

      <section className="card">
        <h2>Create Artifact NFT</h2>
        <form onSubmit={handleCreateArtifact}>
          <label>
            Artifact Name
            <input
              value={artifactName}
              onChange={(e) => setArtifactName(e.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label>
            Metadata URI (IPFS/HTTPS)
            <input
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              required
              placeholder="ipfs://..."
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Private artifact
          </label>
          <button type="submit" disabled={isBusy || !account || !isCorrectNetwork}>
            Mint Artifact
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Read Public Artifact</h2>
        <form onSubmit={handleReadArtifact}>
          <label>
            Token ID
            <input
              type="number"
              min="1"
              value={readTokenId}
              onChange={(e) => setReadTokenId(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={isBusy}>
            Load Artifact
          </button>
        </form>

        {artifactData && (
          <div className="result">
            <p><strong>Owner:</strong> {artifactData.owner}</p>
            <p><strong>Name:</strong> {artifactData.artifactName}</p>
            <p><strong>Metadata URI:</strong> {artifactData.metadataURI || "(hidden)"}</p>
            <p><strong>Private:</strong> {artifactData.isPrivate ? "Yes" : "No"}</p>
            <p><strong>Existence Score:</strong> {artifactData.existenceScore}</p>
            <p><strong>Possession Score:</strong> {artifactData.possessionScore}</p>
            <p><strong>Total Score:</strong> {artifactData.totalScore}</p>
            <p><strong>Created:</strong> {new Date(artifactData.createdAt * 1000).toLocaleString()}</p>
          </div>
        )}
      </section>

      <p className="status">{status}</p>
    </main>
  );
}
