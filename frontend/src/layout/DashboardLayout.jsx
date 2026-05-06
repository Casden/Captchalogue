import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useWallet } from "../wallet/WalletContext";
import { hasContractAddress } from "../lib/contract";
import ThemeToggle from "../components/ThemeToggle";

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/mint", label: "Mint" },
  { to: "/app/explore", label: "Explore" },
  { to: "/app/verify", label: "Verify" },
  { to: "/app/privacy", label: "Privacy" },
  { to: "/app/about", label: "About" },
];

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function DashboardLayout() {
  const { account, isCorrectNetwork, switchToSepolia, disconnect } = useWallet();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [account]);

  return (
    <div className="layout">
      <aside className={`sidebar ${navOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">C</span>
            <span className="brand-name">Captchalogue</span>
          </div>
          <button
            type="button"
            className="nav-toggle"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="wallet-badge">
            <span className="wallet-dot" />
            <span className="wallet-addr" title={account}>{shorten(account)}</span>
          </div>
          <button type="button" className="btn-ghost" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="nav-toggle nav-toggle-mobile"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            ☰
          </button>
          <div className="topbar-right">
            <ThemeToggle className="topbar-theme-toggle" />
            {!hasContractAddress() && (
              <span className="pill pill-warning">Contract address missing</span>
            )}
            {isCorrectNetwork ? (
              <span className="pill pill-success">Sepolia</span>
            ) : (
              <button type="button" className="pill pill-warning pill-button" onClick={switchToSepolia}>
                Switch to Sepolia
              </button>
            )}
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
    </div>
  );
}
