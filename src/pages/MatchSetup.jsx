import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
// Added MdSportsBaseball for the 'Bowl' icon
import {
    MdSportsCricket,
    MdSportsBaseball,
    MdTimer,
    MdGroups,
    MdCheckCircle,
    MdRadioButtonUnchecked,
    MdPlayArrow,
    MdSportsScore
} from "react-icons/md";
import "../App.css";

const MatchSetup = () => {
    const navigate = useNavigate();

    const [teamA, setTeamA] = useState("");
    const [teamB, setTeamB] = useState("");
    const [overs, setOvers] = useState(20);
    const [tossWinner, setTossWinner] = useState("");
    const [tossDecision, setTossDecision] = useState("");

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

    const togglePlayer = (player, team) => {
        const isTeamA = team === "A";
        const otherTeam = isTeamA ? teamBPlayers : teamAPlayers;
        const setTeam = isTeamA ? setTeamAPlayers : setTeamBPlayers;

        if (otherTeam.some(p => p.id === player.id)) return; // Prevent duplicates

        setTeam(prev =>
            prev.some(p => p.id === player.id)
                ? prev.filter(p => p.id !== player.id)
                : [...prev, player]
        );
    };

    const createMatch = async () => {
        if (!teamA || !teamB || !tossWinner || !tossDecision) return alert("Please fill all match details");
        if (teamAPlayers.length === 0 || teamBPlayers.length === 0) return alert("Select players for both teams");

        try {
            const matchRef = await addDoc(collection(db, "matches"), {
                teamA, teamB, overs, tossWinner, tossDecision, status: "live", createdAt: new Date()
            });

            const matchPlayersRef = collection(db, `matches/${matchRef.id}/players`);
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

                /* Section Headers */
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

                /* Cards */
                .setup-card {
                    background: linear-gradient(145deg, var(--bg-input) 0%, rgba(255,255,255,0.02) 100%);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                /* Inputs */
                .input-group {
                    margin-bottom: 1.5rem;
                }
                .label-text {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
                .styled-input {
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
                .styled-input:focus {
                    border-color: var(--accent);
                    background: rgba(34, 197, 94, 0.05);
                }

                /* Toss Selection Grid */
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
                    
                    /* Flexbox for centering Icon + Text */
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
                .selection-btn:hover:not(.active) {
                    background: rgba(255,255,255,0.05);
                }

                /* Squad Lists */
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

                .player-item:hover {
                    background: rgba(255,255,255,0.03);
                }

                .player-item.selected {
                    background: rgba(34, 197, 94, 0.1);
                    border-color: rgba(34, 197, 94, 0.3);
                }

                .player-item.disabled {
                    opacity: 0.3;
                    pointer-events: none;
                    text-decoration: line-through;
                }

                /* Start Button */
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

            {/* --- 2. Toss Section --- */}
            <div className="section-header">
                <MdSportsCricket size={18} /> Toss Result
            </div>
            <div className="setup-card">
                <div style={{ display: 'grid', gap: '1.5rem' }}>

                    {/* Who won? */}
                    <div>
                        <label className="label-text">Who won the toss?</label>
                        <div className="selection-grid">
                            <div
                                className={`selection-btn ${tossWinner === "A" ? "active" : ""}`}
                                onClick={() => setTossWinner("A")}
                            >
                                {teamA || "Team A"}
                            </div>
                            <div
                                className={`selection-btn ${tossWinner === "B" ? "active" : ""}`}
                                onClick={() => setTossWinner("B")}
                            >
                                {teamB || "Team B"}
                            </div>
                        </div>
                    </div>

                    {/* Decision? */}
                    {tossWinner && (
                        <div>
                            <label className="label-text">Elected to?</label>
                            <div className="selection-grid">
                                <div
                                    className={`selection-btn ${tossDecision === "bat" ? "active" : ""}`}
                                    onClick={() => setTossDecision("bat")}
                                >
                                    <MdSportsCricket size={20} />
                                    <span>Bat First</span>
                                </div>
                                <div
                                    className={`selection-btn ${tossDecision === "bowl" ? "active" : ""}`}
                                    onClick={() => setTossDecision("bowl")}
                                >
                                    <MdSportsBaseball size={20} />
                                    <span>Bowl First</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- 3. Squad Selection --- */}
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
                            const isDisabled = teamBPlayers.some(p => p.id === player.id);

                            return (
                                <div
                                    key={player.id}
                                    className={`player-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                    onClick={() => !isDisabled && togglePlayer(player, "A")}
                                >
                                    <span style={{ fontSize: '0.9rem' }}>{player.name}</span>
                                    {isSelected ?
                                        <MdCheckCircle color="var(--accent)" /> :
                                        <MdRadioButtonUnchecked color="#555" />
                                    }
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
                            const isDisabled = teamAPlayers.some(p => p.id === player.id);

                            return (
                                <div
                                    key={player.id}
                                    className={`player-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                    onClick={() => !isDisabled && togglePlayer(player, "B")}
                                    style={isSelected ? { borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.1)' } : {}}
                                >
                                    <span style={{ fontSize: '0.9rem' }}>{player.name}</span>
                                    {isSelected ?
                                        <MdCheckCircle color="#3b82f6" /> :
                                        <MdRadioButtonUnchecked color="#555" />
                                    }
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