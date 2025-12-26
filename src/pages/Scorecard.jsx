import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "../App.css";

import { FaTrophy, FaFire } from "react-icons/fa";
import { MdSportsCricket } from "react-icons/md";
import { IoIosTennisball } from "react-icons/io";

const Scorecard = () => {
    const { matchId } = useParams();
    const [match, setMatch] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(1);

    useEffect(() => {
        const matchRef = doc(db, "matches", matchId);
        const unsubscribeMatch = onSnapshot(matchRef, (docSnap) => {
            if (docSnap.exists()) setMatch(docSnap.data());
        });

        const playersRef = collection(db, `matches/${matchId}/players`);
        const unsubscribePlayers = onSnapshot(playersRef, (querySnapshot) => {
            const playersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlayers(playersData);
            setLoading(false);
        });

        return () => { unsubscribeMatch(); unsubscribePlayers(); };
    }, [matchId]);

    if (loading) return <div className="loader-container"><div className="spinner"></div></div>;
    if (!match) return <div className="container text-center">Match not found</div>;

    // --- Performance Logic (MVP, Best Bat, Best Bowl) ---
    const getMVPScore = (p) => (p.runs || 0) + ((p.wickets || 0) * 20);
    const mvpPlayer = players.length > 0 ? [...players].sort((a, b) => getMVPScore(b) - getMVPScore(a))[0] : null;

    const bestBatsman = [...players].filter(p => (p.runs || 0) > 0).sort((a, b) => {
        if ((b.runs || 0) !== (a.runs || 0)) return b.runs - a.runs;
        return a.balls - b.balls;
    })[0];

    const bestBowler = [...players].filter(p => (p.ballsBowled || 0) > 0).sort((a, b) => {
        if ((b.wickets || 0) !== (a.wickets || 0)) return b.wickets - a.wickets;
        return (a.runsConceded || 0) - (b.runsConceded || 0);
    })[0];

    // --- Team Setup ---
    const tossWinner = match.tossWinner;
    const choice = match.tossDecision;
    let firstBattingTeamCode = ((tossWinner === "A" && choice === "bat") || (tossWinner === "B" && choice === "bowl")) ? "A" : "B";
    let secondBattingTeamCode = firstBattingTeamCode === "A" ? "B" : "A";

    const team1Name = firstBattingTeamCode === "A" ? match.teamA : match.teamB;
    const team2Name = secondBattingTeamCode === "A" ? match.teamA : match.teamB;

    // --- FIX: LIVE SCORE LOGIC ---
    // We determine what to show based on the current 'innings' state
    const getScoreDisplay = (inningNumber) => {
        // If the match is completely finished, use the saved strings
        if (match.status === "completed") {
            return inningNumber === 1 ? match.firstInningsScore : match.secondInningsScore;
        }

        // If currently in 1st Innings
        if (match.innings === 1 || !match.innings) {
            if (inningNumber === 1) return `${match.totalRuns || 0}/${match.wickets || 0} (${match.currentOver || 0}.${match.currentBall || 0})`;
            return "Yet to bat";
        }

        // If currently in 2nd Innings
        if (match.innings === 2) {
            if (inningNumber === 1) return match.firstInningsScore; // 1st inning is done, show saved score
            return `${match.totalRuns || 0}/${match.wickets || 0} (${match.currentOver || 0}.${match.currentBall || 0})`; // 2nd inning is live
        }

        return "0/0";
    };

    // Helpers
    const calculateEconomy = (runs, balls) => balls === 0 ? "0.00" : (runs / (balls / 6)).toFixed(2);
    const calculateSR = (runs, balls) => balls === 0 ? "0.00" : ((runs / balls) * 100).toFixed(0);
    const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

    const MatchHeader = () => (
        <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '2rem 1.5rem',
            borderRadius: '16px',
            color: 'white',
            marginBottom: '2rem',
            textAlign: 'center',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {!match.result && <div className="live-indicator"></div>}
                {match.result ? "Match Finished" : "Live Match"}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                {/* Team 1 Score Display */}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9 }}>{team1Name}</h2>
                    <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1.2, marginTop: '5px' }}>
                        {getScoreDisplay(1)}
                    </div>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>1st Innings</span>
                </div>

                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', opacity: 0.5 }}>VS</div>

                {/* Team 2 Score Display */}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9 }}>{team2Name}</h2>
                    <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1.2, marginTop: '5px' }}>
                        {getScoreDisplay(2)}
                    </div>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>2nd Innings</span>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', display: 'inline-block', fontSize: '0.85rem' }}>
                {match.result || `${match.tossWinner === "A" ? match.teamA : match.teamB} chose to ${match.tossDecision}`}
            </div>
        </div>
    );

    const StatHighlight = ({ icon, label, player, value, color }) => {
        if (!player) return null;
        return (
            <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', minWidth: '200px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${color}20`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>{label}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{player.name}</div>
                    <div style={{ fontSize: '0.85rem', color: color, fontWeight: '600' }}>{value}</div>
                </div>
            </div>
        );
    };

    const DetailedTable = ({ batTeam, bowlTeam }) => {
        const allBattingTeamPlayers = players.filter(p => p.team === (batTeam === team1Name ? firstBattingTeamCode : secondBattingTeamCode));
        const battedPlayers = allBattingTeamPlayers.filter(p => (p.balls > 0) || p.isOut || (p.runs > 0));
        const yetToBatPlayers = allBattingTeamPlayers.filter(p => !battedPlayers.includes(p));

        return (
            <div className="fade-in">
                <div style={{ padding: '10px 0', borderBottom: '2px solid var(--border)', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent)' }}>Batting • {batTeam}</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="score-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: '10px 5px' }}>Batter</th>
                                <th style={{ textAlign: 'center' }}>R</th>
                                <th style={{ textAlign: 'center' }}>B</th>
                                <th style={{ textAlign: 'center' }} className="hide-mobile">4s</th>
                                <th style={{ textAlign: 'center' }} className="hide-mobile">6s</th>
                                <th style={{ textAlign: 'right', paddingRight: '5px' }}>SR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {battedPlayers.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 5px' }}>
                                        <div style={{ fontWeight: '600', color: p.isOut ? 'var(--danger)' : 'var(--text-main)' }}>
                                            {p.name} {p.isOut ? '' : (p.balls > 0 ? '*' : '')}
                                        </div>
                                        {p.isOut && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>out</div>}
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem' }}>{p.runs}</td>
                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{p.balls}</td>
                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }} className="hide-mobile">{p.fours || 0}</td>
                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }} className="hide-mobile">{p.sixes || 0}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', paddingRight: '5px' }}>{calculateSR(p.runs, p.balls)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {yetToBatPlayers.length > 0 && (
                        <div style={{ fontStyle: 'italic', padding: '12px 5px', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <strong style={{ color: 'var(--text-main)' }}>Yet to bat: </strong>
                            <span style={{ color: 'var(--text-muted)' }}>
                                {yetToBatPlayers.map(p => p.name).join(", ")}
                            </span>
                        </div>
                    )}
                </div>

                <div style={{ padding: '20px 0 10px', borderBottom: '2px solid var(--border)', marginBottom: '10px', marginTop: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent)' }}>Bowling • {bowlTeam}</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="score-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: '10px 5px' }}>Bowler</th>
                                <th style={{ textAlign: 'center' }}>O</th>
                                <th style={{ textAlign: 'center' }}>R</th>
                                <th style={{ textAlign: 'center' }}>W</th>
                                <th style={{ textAlign: 'right', paddingRight: '5px' }}>Eco</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.filter(p => p.team === (bowlTeam === team1Name ? firstBattingTeamCode : secondBattingTeamCode) && p.ballsBowled > 0).map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 5px', fontWeight: '500' }}>{p.name}</td>
                                    <td style={{ textAlign: 'center' }}>{formatOvers(p.ballsBowled)}</td>
                                    <td style={{ textAlign: 'center' }}>{p.runsConceded || 0}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: p.wickets > 0 ? 'var(--accent)' : 'inherit' }}>{p.wickets || 0}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', paddingRight: '5px' }}>{calculateEconomy(p.runsConceded || 0, p.ballsBowled)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            <MatchHeader />

            {players.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    <StatHighlight icon={<FaTrophy />} label="MVP" player={mvpPlayer} value={`${mvpPlayer?.runs || 0} Runs, ${mvpPlayer?.wickets || 0} Wkts`} color="#fbbf24" />
                    <StatHighlight icon={<FaFire />} label="Best Bat" player={bestBatsman} value={`${bestBatsman?.runs || 0} (${bestBatsman?.balls || 0})`} color="#38bdf8" />
                    <StatHighlight icon={<IoIosTennisball />} label="Best Bowl" player={bestBowler} value={`${bestBowler?.wickets || 0}-${bestBowler?.runsConceded || 0}`} color="#f472b6" />
                </div>
            )}

            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '4px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <button onClick={() => setActiveTab(1)} style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 1 ? 'var(--accent)' : 'transparent', color: activeTab === 1 ? 'white' : 'var(--text-muted)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    {team1Name} Innings
                </button>
                <button onClick={() => setActiveTab(2)} style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 2 ? 'var(--accent)' : 'transparent', color: activeTab === 2 ? 'white' : 'var(--text-muted)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    {team2Name} Innings
                </button>
            </div>

            {activeTab === 1 ? <DetailedTable batTeam={team1Name} bowlTeam={team2Name} /> : <DetailedTable batTeam={team2Name} bowlTeam={team1Name} />}
        </div>
    );
};

export default Scorecard;