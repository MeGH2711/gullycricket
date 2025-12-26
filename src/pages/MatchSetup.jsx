import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
    MdSportsCricket,
    MdSportsBaseball,
    MdTimer,
    MdGroups,
    MdCheckCircle,
    MdRadioButtonUnchecked,
    MdPlayArrow,
    MdSportsScore,
    MdPerson // Added Icon
} from "react-icons/md";
import "../App.css";

const MatchSetup = () => {
    const navigate = useNavigate();

    const [teamA, setTeamA] = useState("");
    const [teamB, setTeamB] = useState("");
    const [overs, setOvers] = useState(6);
    const [tossWinner, setTossWinner] = useState("");
    const [tossDecision, setTossDecision] = useState("");

    // --- NEW: Jacker State ---
    const [jackerId, setJackerId] = useState("");

    const [allPlayers, setAllPlayers] = useState([]);
    const [teamAPlayers, setTeamAPlayers] = useState([]);
    const [teamBPlayers, setTeamBPlayers] = useState([]);

    useEffect(() => {
        const fetchPlayers = async () => {
            const snapshot = await getDocs(collection(db, "players"));
            setAllPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchPlayers();
    }, []);

    // --- NEW: Handle Jacker Selection ---
    const handleJackerSelect = (e) => {
        const selectedId = e.target.value;
        setJackerId(selectedId);

        if (!selectedId) return;

        const playerObj = allPlayers.find(p => p.id === selectedId);
        if (!playerObj) return;

        // Auto-add to Team A if not present
        setTeamAPlayers(prev =>
            prev.some(p => p.id === selectedId) ? prev : [...prev, playerObj]
        );

        // Auto-add to Team B if not present
        setTeamBPlayers(prev =>
            prev.some(p => p.id === selectedId) ? prev : [...prev, playerObj]
        );
    };

    const togglePlayer = (player, team) => {
        const isTeamA = team === "A";
        const otherTeam = isTeamA ? teamBPlayers : teamAPlayers;
        const setTeam = isTeamA ? setTeamAPlayers : setTeamBPlayers;

        const isCurrentlyInTeam = (isTeamA ? teamAPlayers : teamBPlayers).some(p => p.id === player.id);

        if (isCurrentlyInTeam) {
            // Removing player
            setTeam(prev => prev.filter(p => p.id !== player.id));
            // If we remove the Jacker manually, clear the Jacker selection
            if (player.id === jackerId) setJackerId("");
        } else {
            // Adding player
            // CONSTRAINT: Allow if NOT in other team OR if they are the designated Jacker
            if (player.id !== jackerId && otherTeam.some(p => p.id === player.id)) {
                return; // Block duplicates unless Jacker
            }
            setTeam(prev => [...prev, player]);
        }
    };

    const createMatch = async () => {
        if (!teamA || !teamB || !tossWinner || !tossDecision) return alert("Please fill all match details");
        if (teamAPlayers.length === 0 || teamBPlayers.length === 0) return alert("Select players for both teams");

        try {
            const matchRef = await addDoc(collection(db, "matches"), {
                teamA, teamB, overs, tossWinner, tossDecision, status: "live", createdAt: new Date()
            });

            const matchPlayersRef = collection(db, `matches/${matchRef.id}/players`);

            // Note: The Jacker will be added twice (once for A, once for B) which is correct behavior
            // They will have unique IDs within the match subcollection, allowing separate stats for each team.
            const addPlayerPromises = [
                ...teamAPlayers.map(p => addDoc(matchPlayersRef, { name: p.name, team: "A", runs: 0, balls: 0, wickets: 0 })),
                ...teamBPlayers.map(p => addDoc(matchPlayersRef, { name: p.name, team: "B", runs: 0, balls: 0, wickets: 0 }))
            ];
            await Promise.all(addPlayerPromises);

            navigate(`/scoring-setup/${matchRef.id}`);
        } catch (error) {
            console.error(error);
            alert("Error creating match");
        }
    };

    return (
        <div className="container match-setup-container">
            <style>{`
                .match-setup-container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding-bottom: 4rem;
                }
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 1rem;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 600;
                }
                .setup-card {
                    background: linear-gradient(145deg, var(--bg-input) 0%, rgba(255,255,255,0.02) 100%);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .input-group { margin-bottom: 1.5rem; }
                .label-text {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
                .styled-input, .styled-select {
                    width: 100%;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--border);
                    padding: 12px 16px;
                    border-radius: 8px;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .styled-select option { background: #1e293b; }
                .styled-input:focus, .styled-select:focus {
                    border-color: var(--accent);
                    background: rgba(34, 197, 94, 0.05);
                }
                .selection-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .selection-btn {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--border);
                    padding: 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                .selection-btn.active {
                    background: rgba(34, 197, 94, 0.15);
                    border-color: var(--accent);
                    color: white;
                    font-weight: 600;
                    box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
                }
                .squad-columns {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                @media(min-width: 768px) {
                    .squad-columns { grid-template-columns: 1fr 1fr; }
                }
                .roster-box {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    height: 350px;
                    overflow-y: auto;
                    padding: 0.5rem;
                }
                .player-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 12px;
                    margin-bottom: 4px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .player-item:hover { background: rgba(255,255,255,0.03); }
                .player-item.selected {
                    background: rgba(34, 197, 94, 0.1);
                    border-color: rgba(34, 197, 94, 0.3);
                }
                .player-item.disabled {
                    opacity: 0.3;
                    pointer-events: none;
                    text-decoration: line-through;
                }
                .jacker-badge {
                    font-size: 0.7rem;
                    background: #f59e0b;
                    color: black;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: bold;
                    margin-left: 8px;
                }
                .start-btn {
                    width: 100%;
                    padding: 1rem;
                    background: var(--accent);
                    color: black;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: transform 0.1s;
                }
                .start-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
                }
            `}</style>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>New Fixture</h2>
                <p style={{ color: 'var(--text-muted)' }}>Configure match details and squads</p>
            </div>

            {/* --- 1. Match Info --- */}
            <div className="section-header">
                <MdSportsScore size={18} /> Match Details
            </div>
            <div className="setup-card">
                <div className="selection-grid" style={{ marginBottom: '1rem' }}>
                    <div className="input-group">
                        <label className="label-text">Team A Name</label>
                        <input
                            className="styled-input"
                            placeholder="e.g. Thunder XI"
                            value={teamA}
                            onChange={e => setTeamA(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="label-text">Team B Name</label>
                        <input
                            className="styled-input"
                            placeholder="e.g. Lightning Strikers"
                            value={teamB}
                            onChange={e => setTeamB(e.target.value)}
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="label-text" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MdTimer /> Overs per Innings
                    </label>
                    <input
                        type="number"
                        className="styled-input"
                        value={overs}
                        onChange={e => setOvers(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* --- 2. Jacker Selection (NEW) --- */}
            <div className="section-header">
                <MdPerson size={18} /> Jacker (Optional)
            </div>
            <div className="setup-card" style={{ borderColor: jackerId ? '#f59e0b' : 'var(--border)' }}>
                <label className="label-text">Select one player to play for BOTH teams:</label>
                <select
                    className="styled-select"
                    value={jackerId}
                    onChange={handleJackerSelect}
                >
                    <option value="">-- No Jacker --</option>
                    {allPlayers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                {jackerId && (
                    <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#f59e0b' }}>
                        * This player has been added to both squads automatically.
                    </div>
                )}
            </div>

            {/* --- 3. Toss Section --- */}
            <div className="section-header">
                <MdSportsCricket size={18} /> Toss Result
            </div>
            <div className="setup-card">
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label className="label-text">Who won the toss?</label>
                        <div className="selection-grid">
                            <div className={`selection-btn ${tossWinner === "A" ? "active" : ""}`} onClick={() => setTossWinner("A")}>
                                {teamA || "Team A"}
                            </div>
                            <div className={`selection-btn ${tossWinner === "B" ? "active" : ""}`} onClick={() => setTossWinner("B")}>
                                {teamB || "Team B"}
                            </div>
                        </div>
                    </div>

                    {tossWinner && (
                        <div>
                            <label className="label-text">Elected to?</label>
                            <div className="selection-grid">
                                <div className={`selection-btn ${tossDecision === "bat" ? "active" : ""}`} onClick={() => setTossDecision("bat")}>
                                    <MdSportsCricket size={20} /> <span>Bat First</span>
                                </div>
                                <div className={`selection-btn ${tossDecision === "bowl" ? "active" : ""}`} onClick={() => setTossDecision("bowl")}>
                                    <MdSportsBaseball size={20} /> <span>Bowl First</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- 4. Squad Selection --- */}
            <div className="section-header">
                <MdGroups size={18} /> Select Squads
            </div>
            <div className="squad-columns">

                {/* Team A List */}
                <div className="setup-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{teamA || "Team A"}</span>
                        <span style={{ fontSize: '0.8rem', background: '#333', padding: '2px 8px', borderRadius: '10px' }}>
                            Selected: {teamAPlayers.length}
                        </span>
                    </div>

                    <div className="roster-box custom-scroll">
                        {allPlayers.map(player => {
                            const isSelected = teamAPlayers.some(p => p.id === player.id);
                            // Disable logic: Disabled if in Team B AND not the jacker
                            const isDisabled = teamBPlayers.some(p => p.id === player.id) && player.id !== jackerId;
                            const isJacker = player.id === jackerId;

                            return (
                                <div
                                    key={player.id}
                                    className={`player-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                    onClick={() => !isDisabled && togglePlayer(player, "A")}
                                >
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                        {player.name}
                                        {isJacker && <span className="jacker-badge">J</span>}
                                    </span>
                                    {isSelected ? <MdCheckCircle color="var(--accent)" /> : <MdRadioButtonUnchecked color="#555" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Team B List */}
                <div className="setup-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '600', color: '#3b82f6' }}>{teamB || "Team B"}</span>
                        <span style={{ fontSize: '0.8rem', background: '#333', padding: '2px 8px', borderRadius: '10px' }}>
                            Selected: {teamBPlayers.length}
                        </span>
                    </div>

                    <div className="roster-box custom-scroll">
                        {allPlayers.map(player => {
                            const isSelected = teamBPlayers.some(p => p.id === player.id);
                            // Disable logic: Disabled if in Team A AND not the jacker
                            const isDisabled = teamAPlayers.some(p => p.id === player.id) && player.id !== jackerId;
                            const isJacker = player.id === jackerId;

                            return (
                                <div
                                    key={player.id}
                                    className={`player-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                    onClick={() => !isDisabled && togglePlayer(player, "B")}
                                    style={isSelected ? { borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.1)' } : {}}
                                >
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                        {player.name}
                                        {isJacker && <span className="jacker-badge">J</span>}
                                    </span>
                                    {isSelected ? <MdCheckCircle color="#3b82f6" /> : <MdRadioButtonUnchecked color="#555" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button className="start-btn" onClick={createMatch}>
                Start Match <MdPlayArrow size={24} />
            </button>
        </div>
    );
};

export default MatchSetup;