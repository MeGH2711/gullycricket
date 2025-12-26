import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../App.css";

const ScoringSetup = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [players, setPlayers] = useState([]);
    
    // Form State
    const [striker, setStriker] = useState("");
    const [nonStriker, setNonStriker] = useState("");
    const [bowler, setBowler] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const matchSnap = await getDoc(doc(db, "matches", matchId));
            setMatch(matchSnap.data());
            const playersSnap = await getDocs(collection(db, `matches/${matchId}/players`));
            setPlayers(playersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchData();
    }, [matchId]);

    if (!match) return <div className="loader-container"><div className="spinner"></div></div>;

    // Determine Teams
    let battingTeam, bowlingTeam;
    if (match.innings === 2 || match.status === "inningsBreak") {
        battingTeam = match.battingTeam;
        bowlingTeam = match.bowlingTeam;
    } else {
        battingTeam = ((match.tossWinner === "A" && match.tossDecision === "bat") || (match.tossWinner === "B" && match.tossDecision === "bowl")) ? "A" : "B";
        bowlingTeam = battingTeam === "A" ? "B" : "A";
    }

    const battingPlayers = players.filter(p => p.team === battingTeam);
    const bowlingPlayers = players.filter(p => p.team === bowlingTeam);

    const startScoring = async () => {
        if (!striker || !nonStriker || !bowler) return alert("Select all players");
        if (striker === nonStriker) return alert("Striker and Non-Striker must be different");

        await updateDoc(doc(db, "matches", matchId), {
            striker, nonStriker, currentBowler: bowler,
            battingTeam, bowlingTeam, status: "live"
        });
        navigate(`/scoring/${matchId}`);
    };

    return (
        <div className="container" style={{maxWidth: '500px'}}>
            <h2 className="page-title">{match.innings === 2 ? "2nd Innings" : "Opening Players"}</h2>
            
            <div className="card">
                <h4 className="form-label" style={{color: 'var(--accent)', marginBottom:'1.5rem'}}>Batting (Openers)</h4>
                
                <div className="form-group">
                    <label className="form-label">Striker</label>
                    <select className="select" value={striker} onChange={e => setStriker(e.target.value)}>
                        <option value="">Select Striker</option>
                        {battingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Non-Striker</label>
                    <select className="select" value={nonStriker} onChange={e => setNonStriker(e.target.value)}>
                        <option value="">Select Non-Striker</option>
                        {battingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="card">
                <h4 className="form-label" style={{color: 'var(--text-muted)', marginBottom:'1.5rem'}}>Bowling</h4>
                <div className="form-group">
                    <label className="form-label">Opening Bowler</label>
                    <select className="select" value={bowler} onChange={e => setBowler(e.target.value)}>
                        <option value="">Select Bowler</option>
                        {bowlingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <button className="btn btn-success" onClick={startScoring}>Let's Play</button>
        </div>
    );
};

export default ScoringSetup;