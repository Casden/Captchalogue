import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeContext";
import { WalletProvider } from "./wallet/WalletContext";
import { ToastProvider } from "./components/StatusBanner";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <WalletProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </WalletProvider>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
