import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";

const WalletContext = createContext(null);

function parseError(error) {
  return (
    error?.reason ||
    error?.shortMessage ||
    error?.message ||
    "Wallet operation failed."
  );
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState("");

  const isMetaMaskInstalled =
    typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  const provider = useMemo(() => {
    if (!isMetaMaskInstalled) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, [isMetaMaskInstalled]);

  const refresh = useCallback(async () => {
    if (!provider) return;
    try {
      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));
      const accounts = await provider.send("eth_accounts", []);
      setAccount(accounts[0] || "");
    } catch (err) {
      setError(parseError(err));
    }
  }, [provider]);

  useEffect(() => {
    if (!isMetaMaskInstalled) return undefined;
    refresh();

    const handleAccountsChanged = (accounts) => setAccount(accounts[0] || "");
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [isMetaMaskInstalled, refresh]);

  const connect = useCallback(async () => {
    setError("");
    try {
      if (!provider) throw new Error("MetaMask is not installed.");
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0] || "");
      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));
    } catch (err) {
      setError(parseError(err));
    }
  }, [provider]);

  const switchToSepolia = useCallback(async () => {
    setError("");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_HEX }],
      });
      await refresh();
    } catch (err) {
      setError(parseError(err));
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    setAccount("");
  }, []);

  const getSigner = useCallback(async () => {
    if (!provider) throw new Error("MetaMask is not installed.");
    return provider.getSigner();
  }, [provider]);

  const value = useMemo(
    () => ({
      account,
      chainId,
      provider,
      isMetaMaskInstalled,
      isConnected: Boolean(account),
      isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
      sepoliaChainId: SEPOLIA_CHAIN_ID,
      error,
      connect,
      disconnect,
      switchToSepolia,
      getSigner,
      refresh,
    }),
    [
      account,
      chainId,
      provider,
      isMetaMaskInstalled,
      error,
      connect,
      disconnect,
      switchToSepolia,
      getSigner,
      refresh,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider.");
  }
  return ctx;
}
