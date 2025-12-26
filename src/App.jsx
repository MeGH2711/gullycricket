import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MatchSetup from "./pages/MatchSetup";
import AddPlayers from "./pages/AddPlayers";
import ScoringSetup from "./pages/ScoringSetup";
import LiveScoring from "./pages/LiveScoring";
import Scorecard from "./pages/Scorecard";
import MatchesList from './pages/MatchList';
import PlayerStats from "./pages/PlayerStats"; // <--- IMPORT THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/new-match" element={<MatchSetup />} />
        <Route path="/players" element={<AddPlayers />} />
        <Route path="/matches" element={<MatchesList />} />

        {/* NEW ROUTE */}
        <Route path="/stats" element={<PlayerStats />} />

        {/* Scoring Routes */}
        <Route path="/scoring-setup/:matchId" element={<ScoringSetup />} />
        <Route path="/scoring/:matchId" element={<LiveScoring />} />
        <Route path="/scorecard/:matchId" element={<Scorecard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;