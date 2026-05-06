import { Navigate, useLocation } from "react-router-dom";
import { useWallet } from "./WalletContext";

export default function RequireWallet({ children }) {
  const { isConnected } = useWallet();
  const location = useLocation();

  if (!isConnected) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}
