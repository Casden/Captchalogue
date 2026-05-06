import { Navigate, Route, Routes } from "react-router-dom";
import RequireWallet from "./wallet/RequireWallet";
import DashboardLayout from "./layout/DashboardLayout";
import ConnectPage from "./pages/ConnectPage";
import DashboardPage from "./pages/DashboardPage";
import MintPage from "./pages/MintPage";
import ExplorePage from "./pages/ExplorePage";
import VerifyPage from "./pages/VerifyPage";
import PrivacyPage from "./pages/PrivacyPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ConnectPage />} />
      <Route
        path="/app"
        element={
          <RequireWallet>
            <DashboardLayout />
          </RequireWallet>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="mint" element={<MintPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
