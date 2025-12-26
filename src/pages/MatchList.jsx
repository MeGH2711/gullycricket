import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import "../App.css";

const MatchesList = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                // creating a query to fetch matches
                const q = query(collection(db, "matches"));
                const querySnapshot = await getDocs(q);
                const matchesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Optional: Sort matches by date if needed
                // matchesData.sort((a, b) => new Date(b.date) - new Date(a.date));
                setMatches(matchesData);
            } catch (error) {
                console.error("Error fetching matches:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

    // Helper to determine match status text
    const getStatusText = (match) => {
        if (match.result) return match.result;
        if (match.tossWinner && match.tossDecision) {
            const winnerName = match.tossWinner === "A" ? match.teamA : match.teamB;
            return `${winnerName} won the toss and elected to ${match.tossDecision}`;
        }
        return "Match scheduled";
    };

    // Helper to format the date
    const formatDate = (dateVal) => {
        if (!dateVal) return "";

        // Handle Firebase Timestamp (which has a toDate method)
        if (dateVal.toDate) {
            return dateVal.toDate().toLocaleDateString('en-US', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        }

        // Handle string or standard Date objects
        return new Date(dateVal).toLocaleDateString('en-US', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

    return (
        <div className="container">
            <div className="page-title">
                <h2>Live & Recent Matches</h2>
            </div>

            {matches.length === 0 ? (
                <div className="card text-center" style={{ color: 'var(--text-muted)' }}>
                    No matches found.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {matches.map((match) => (
                        <div key={match.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>

                            {/* --- Card Header --- */}
                            <div style={{
                                padding: '10px 15px',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                {/* UPDATED: Showing Date instead of "Individual Match" */}
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {formatDate(match.createdAt)}
                                </span>

                                <span style={{
                                    background: match.result ? '#475569' : '#ef4444',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}>
                                    {match.result ? "FINISHED" : "LIVE"}
                                </span>
                            </div>

                            {/* --- Scores Section --- */}
                            <div style={{ padding: '15px' }}>
                                {/* Team A Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{match.teamA}</span>
                                    <span style={{
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        color: match.firstInningsScore ? 'var(--accent)' : 'var(--text-muted)'
                                    }}>
                                        {match.firstInningsScore || "Yet to bat"}
                                    </span>
                                </div>

                                {/* Team B Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{match.teamB}</span>
                                    <span style={{
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        color: match.secondInningsScore ? 'var(--accent)' : 'var(--text-muted)'
                                    }}>
                                        {match.secondInningsScore || "Yet to bat"}
                                    </span>
                                </div>

                                {/* Toss / Status Info */}
                                <div style={{
                                    marginTop: '15px',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    {getStatusText(match)}
                                </div>
                            </div>

                            {/* --- Action Button --- */}
                            <button
                                className="btn"
                                style={{
                                    width: '100%',
                                    borderRadius: '0',
                                    background: 'var(--bg-input)',
                                    color: 'var(--accent)',
                                    borderTop: '1px solid var(--border)',
                                    padding: '12px'
                                }}
                                onClick={() => navigate(`/scorecard/${match.id}`)}
                            >
                                View Scorecard →
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MatchesList;