import { Navigate, Route, Routes } from "react-router-dom";
import RequireWallet from "./wallet/RequireWallet";
import DashboardLayout from "./layout/DashboardLayout";
import ConnectPage from "./pages/ConnectPage";
import DashboardPage from "./pages/DashboardPage";
import MintPage from "./pages/MintPage";
import MyArtifactsPage from "./pages/MyArtifactsPage";
import ExplorePage from "./pages/ExplorePage";
import AboutPage from "./pages/AboutPage";
import ArtifactDetailPage from "./pages/ArtifactDetailPage";

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
        <Route path="artifacts" element={<MyArtifactsPage />} />
        <Route path="artifacts/:tokenId" element={<ArtifactDetailPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
