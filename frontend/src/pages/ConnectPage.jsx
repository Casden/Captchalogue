import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../wallet/WalletContext";
import { useToast } from "../components/StatusBanner";
import { hasContractAddress } from "../lib/contract";
import ThemeToggle from "../components/ThemeToggle";

export default function ConnectPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    isMetaMaskInstalled,
    isConnected,
    isCorrectNetwork,
    connect,
    switchToSepolia,
    error,
  } = useWallet();
  const brandLogoUrl = `${import.meta.env.BASE_URL}assets/homestuck/logo/SBurb_Logo.svg`;

  useEffect(() => {
    if (isConnected) {
      navigate("/app", { replace: true });
    }
  }, [isConnected, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  return (
    <div className="connect-page">
      <ThemeToggle className="connect-theme-toggle" />
      <div className="connect-card">
        <div className="brand large">
          <img className="brand-mark brand-mark-image" src={brandLogoUrl} alt="" aria-hidden="true" />
          <span className="brand-name">Captchalogue</span>
        </div>

        <h1 className="connect-title">An NFT registry for physical artifacts</h1>
        <p className="connect-sub">
          Mint, verify, and explore on-chain artifacts on the Sepolia testnet.
          Connect your wallet to access the dashboard.
        </p>

        <div className="connect-actions">
          {!isMetaMaskInstalled ? (
            <a
              href="https://metamask.io/download/"
              className="btn btn-primary"
              target="_blank"
              rel="noreferrer"
            >
              Install MetaMask
            </a>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={connect}>
                Connect MetaMask
              </button>
              {!isCorrectNetwork && (
                <button type="button" className="btn btn-secondary" onClick={switchToSepolia}>
                  Switch to Sepolia
                </button>
              )}
            </>
          )}
        </div>

        {!hasContractAddress() && (
          <p className="warning-banner">
            Set <code>VITE_CONTRACT_ADDRESS</code> in your frontend <code>.env</code> before connecting.
          </p>
        )}

        <ul className="feature-list">
          <li>Drag-and-drop artwork uploads with in-browser IPFS</li>
          <li>Two-part verification evidence (existence + possession)</li>
          <li>Public and private artifacts with owner-only details</li>
        </ul>
      </div>
    </div>
  );
}
