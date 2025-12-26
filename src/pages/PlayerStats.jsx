import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";
import { MdBarChart } from "react-icons/md";
import { FaRunning, FaBowlingBall } from "react-icons/fa";
import "../App.css";

const PlayerStats = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("batting"); // 'batting' or 'bowling'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const q = query(collectionGroup(db, "players"));
                const querySnapshot = await getDocs(q);

                const aggregator = {};

                querySnapshot.forEach((doc) => {
                    const data = doc.data();

                    // Skip roster docs that don't have match stats
                    if (typeof data.runs === "undefined" && typeof data.wickets === "undefined") {
                        return;
                    }

                    const playerName = data.name;

                    if (!aggregator[playerName]) {
                        aggregator[playerName] = {
                            name: playerName,
                            inningsPlayed: 0,
                            // Batting
                            totalRuns: 0,
                            ballsFaced: 0,
                            fours: 0,
                            sixes: 0,
                            highestScore: 0,
                            // Bowling
                            totalWickets: 0,
                            ballsBowled: 0,
                            runsConceded: 0,
                            bestBowling: { wickets: 0, runs: 0 }
                        };
                    }

                    const player = aggregator[playerName];
                    const runData = data.runs || 0;
                    const wicketData = data.wickets || 0;
                    const runsGiven = data.runsConceded || 0; // Ensure your DB has this, or economy will be 0

                    // Accumulate Batting
                    player.totalRuns += runData;
                    player.ballsFaced += (data.balls || 0);
                    player.fours += (data.fours || 0);
                    player.sixes += (data.sixes || 0);
                    player.inningsPlayed += 1;

                    // Calculate High Score
                    if (runData > player.highestScore) {
                        player.highestScore = runData;
                    }

                    // Accumulate Bowling
                    player.totalWickets += wicketData;
                    player.ballsBowled += (data.ballsBowled || 0);
                    player.runsConceded += runsGiven;

                    // Calculate Best Bowling (Most wickets, if tie then least runs)
                    if (wicketData > player.bestBowling.wickets) {
                        player.bestBowling = { wickets: wicketData, runs: runsGiven };
                    } else if (wicketData === player.bestBowling.wickets) {
                        if (runsGiven < player.bestBowling.runs) {
                            player.bestBowling = { wickets: wicketData, runs: runsGiven };
                        }
                    }
                });

                setStats(Object.values(aggregator));
            } catch (error) {
                console.error("Error calculating stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Helper functions for detailed metrics
    const getStrikeRate = (runs, balls) => {
        if (!balls) return "0.0";
        return ((runs / balls) * 100).toFixed(1);
    };

    const getEconomy = (runs, balls) => {
        if (!balls) return "0.0";
        const overs = balls / 6;
        return (runs / overs).toFixed(1);
    };

    const getOvers = (balls) => {
        const fullOvers = Math.floor(balls / 6);
        const ballsRemaining = balls % 6;
        return ballsRemaining === 0 ? fullOvers : `${fullOvers}.${ballsRemaining}`;
    };

    // Sorting Logic based on view mode
    const sortedStats = [...stats].sort((a, b) => {
        if (viewMode === "batting") return b.totalRuns - a.totalRuns;
        if (viewMode === "bowling") return b.totalWickets - a.totalWickets;
        return 0;
    });

    if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '50px' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <MdBarChart style={{ color: 'var(--accent)' }} /> Player Statistics
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Detailed career records</p>
            </div>

            {/* Toggle View Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <button
                    className="btn"
                    style={{
                        background: viewMode === 'batting' ? 'var(--accent)' : 'var(--bg-input)',
                        color: viewMode === 'batting' ? '#000' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        minWidth: '120px'
                    }}
                    onClick={() => setViewMode("batting")}
                >
                    <FaRunning style={{ marginRight: '5px' }} /> Batting
                </button>
                <button
                    className="btn"
                    style={{
                        background: viewMode === 'bowling' ? 'var(--accent)' : 'var(--bg-input)',
                        color: viewMode === 'bowling' ? '#000' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        minWidth: '120px'
                    }}
                    onClick={() => setViewMode("bowling")}
                >
                    <FaBowlingBall style={{ marginRight: '5px' }} /> Bowling
                </button>
            </div>

            {/* Stats Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {stats.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No match data found.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="score-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', minWidth: '140px' }}>Player</th>
                                    <th style={{ padding: '12px' }}>Mat</th>

                                    {/* Conditional Headers based on View Mode */}
                                    {viewMode === 'batting' ? (
                                        <>
                                            <th style={{ padding: '12px', color: 'var(--accent)' }}>Runs</th>
                                            <th style={{ padding: '12px' }}>Balls</th>
                                            <th style={{ padding: '12px' }}>HS</th>
                                            <th style={{ padding: '12px' }}>SR</th>
                                            <th style={{ padding: '12px' }}>4s/6s</th>
                                        </>
                                    ) : (
                                        <>
                                            <th style={{ padding: '12px', color: 'var(--accent)' }}>Wkts</th>
                                            <th style={{ padding: '12px' }}>Overs</th>
                                            <th style={{ padding: '12px' }}>Runs</th>
                                            <th style={{ padding: '12px' }}>Econ</th>
                                            <th style={{ padding: '12px' }}>BBI</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStats.map((player, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                                        {/* Player Name Column */}
                                        <td style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>{index + 1}</span>
                                                {player.name}
                                            </div>
                                        </td>

                                        {/* Matches Column */}
                                        <td style={{ padding: '12px', textAlign: 'center', opacity: 0.7 }}>{player.inningsPlayed}</td>

                                        {/* Batting Data Rows */}
                                        {viewMode === 'batting' && (
                                            <>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent)' }}>
                                                    {player.totalRuns}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{player.ballsFaced}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{player.highestScore}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>
                                                    {getStrikeRate(player.totalRuns, player.ballsFaced)}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {player.fours}/{player.sixes}
                                                </td>
                                            </>
                                        )}

                                        {/* Bowling Data Rows */}
                                        {viewMode === 'bowling' && (
                                            <>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent)' }}>
                                                    {player.totalWickets}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {getOvers(player.ballsBowled)}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{player.runsConceded}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>
                                                    {getEconomy(player.runsConceded, player.ballsBowled)}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {player.bestBowling.wickets}/{player.bestBowling.runs}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerStats;