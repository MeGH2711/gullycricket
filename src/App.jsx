import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage"; // Import the new page
import MatchSetup from "./pages/MatchSetup";
import AddPlayers from "./pages/AddPlayers";
import ScoringSetup from "./pages/ScoringSetup";
import LiveScoring from "./pages/LiveScoring";
import Scorecard from "./pages/Scorecard";
import MatchesList from './pages/MatchList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route is now Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Match Setup moved to its own path */}
        <Route path="/new-match" element={<MatchSetup />} />

        <Route path="/players" element={<AddPlayers />} />
        <Route path="/matches" element={<MatchesList />} />

        {/* Scoring Routes */}
        <Route path="/scoring-setup/:matchId" element={<ScoringSetup />} />
        <Route path="/scoring/:matchId" element={<LiveScoring />} />
        <Route path="/scorecard/:matchId" element={<Scorecard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;