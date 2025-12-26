import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    doc,
    getDoc,
    updateDoc,
    increment,
    collection,
    getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import "./css/LiveScoring.css";

const LiveScoring = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);

    const [strikerPlayer, setStrikerPlayer] = useState(null);
    const [nonStrikerPlayer, setNonStrikerPlayer] = useState(null);
    const [bowlerPlayer, setBowlerPlayer] = useState(null);

    const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
    const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [modalContext, setModalContext] = useState("");
    const [selectedPlayerId, setSelectedPlayerId] = useState("");

    // --- Run Out State ---
    const [runOutWho, setRunOutWho] = useState("striker");
    const [nextStrikerChoice, setNextStrikerChoice] = useState("new");
    const [runOutBallType, setRunOutBallType] = useState("legal"); // 'legal', 'wide', 'noball'
    const [runOutRuns, setRunOutRuns] = useState(0);

    const [ballHistory, setBallHistory] = useState([]);
    const [ballLog, setBallLog] = useState([]);

    const [showNoBallModal, setShowNoBallModal] = useState(false);
    const [noBallRuns, setNoBallRuns] = useState(0);

    const [showInningsBreakModal, setShowInningsBreakModal] = useState(false);
    const [showMatchEndModal, setShowMatchEndModal] = useState(false);
    const [matchResult, setMatchResult] = useState("");

    // Initial Load
    useEffect(() => {
        const loadMatch = async () => {
            try {
                const snap = await getDoc(doc(db, "matches", matchId));
                if (snap.exists()) {
                    setMatch({ id: snap.id, ...snap.data() });
                }
            } catch (err) {
                console.error("Error loading match:", err);
            }
            setLoading(false);
        };
        loadMatch();
    }, [matchId]);

    // Load Players
    useEffect(() => {
        if (!match) return;

        const loadPlayers = async () => {
            const allPlayersSnap = await getDocs(collection(db, `matches/${matchId}/players`));
            const allPlayers = allPlayersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            setStrikerPlayer(allPlayers.find(p => p.id === match.striker));
            setNonStrikerPlayer(allPlayers.find(p => p.id === match.nonStriker));
            setBowlerPlayer(allPlayers.find(p => p.id === match.currentBowler));

            setBattingTeamPlayers(allPlayers.filter(p => p.team === match.battingTeam));
            setBowlingTeamPlayers(allPlayers.filter(p => p.team === match.bowlingTeam));
        };

        loadPlayers();
    }, [match, matchId]);

    // --- LOGIC FOR INNINGS / MATCH END ---
    useEffect(() => {
        if (!match || battingTeamPlayers.length === 0) return;
        if (match.status === "completed") return; // Stop if already done

        const maxWickets = battingTeamPlayers.length; // All out count
        const safeWickets = match.wickets || 0;
        const safeOver = match.currentOver || 0;
        const currentRuns = match.totalRuns || 0;

        // 1. CHECK IF MATCH IS WON (For 2nd Innings Chasing)
        if (match.innings === 2) {
            const target = match.target;

            // Case A: Batting Team Chases Target
            if (currentRuns >= target) {
                const wicketsLeft = maxWickets - safeWickets;
                const winningTeamName = match.battingTeam === "A" ? match.teamA : match.teamB;
                setMatchResult(`${winningTeamName} won by ${wicketsLeft} wickets`);
                setShowMatchEndModal(true);
                return;
            }

            // Case B: Bowling Team Defends (All Out OR Overs Finished)
            if (safeWickets >= maxWickets || safeOver >= match.overs) {
                if (currentRuns < target - 1) {
                    const runMargin = (target - 1) - currentRuns;
                    const winningTeamName = match.bowlingTeam === "A" ? match.teamA : match.teamB;
                    setMatchResult(`${winningTeamName} won by ${runMargin} runs`);
                } else {
                    setMatchResult("Match Tied");
                }
                setShowMatchEndModal(true);
                return;
            }
        }
        // 2. CHECK FOR 1st INNINGS END
        else if (match.innings === 1 || !match.innings) {
            if (safeWickets >= maxWickets || safeOver >= match.overs) {
                setShowInningsBreakModal(true);
            }
        }

    }, [match, battingTeamPlayers]);

    const startNextInnings = async () => {
        const matchRef = doc(db, "matches", matchId);
        const newBattingTeam = match.bowlingTeam;
        const newBowlingTeam = match.battingTeam;

        await updateDoc(matchRef, {
            innings: 2,
            status: "inningsBreak",
            firstInningsScore: `${match.totalRuns || 0}/${match.wickets || 0}`,
            target: (match.totalRuns || 0) + 1,
            battingTeam: newBattingTeam,
            bowlingTeam: newBowlingTeam,
            totalRuns: 0,
            wickets: 0,
            currentOver: 0,
            currentBall: 0,
            striker: "",
            nonStriker: "",
            currentBowler: ""
        });

        navigate(`/scoring-setup/${matchId}`);
    };

    const finishMatch = async () => {
        await updateDoc(doc(db, "matches", matchId), {
            status: "completed",
            result: matchResult,
            secondInningsScore: `${match.totalRuns}/${match.wickets}`
        });
        navigate(`/scorecard/${matchId}`);
    };

    if (loading || !match) return <div className="loader-container"><div className="spinner-border text-primary"></div></div>;

    const {
        striker,
        nonStriker,
        currentBowler,
        totalRuns = 0,
        currentBall = 0,
        currentOver = 0,
        wickets = 0
    } = match;

    const formatOvers = (balls) => {
        const oversCount = Math.floor(balls / 6);
        const remainingBalls = balls % 6;
        return `${oversCount}.${remainingBalls}`;
    };

    const getBallDisplay = (b) => {
        if (b.wicket) return 'W';
        if (b.extraType === "Wide") return b.runInput > 0 ? `WD+${b.runInput}` : "WD";
        if (b.extraType === "No Ball") return b.runInput > 0 ? `NB+${b.runInput}` : "NB";
        return b.runs;
    };

    // Derived Logic for Solo Play
    const isSoloPlay = !nonStriker;
    const benchPlayers = battingTeamPlayers.filter(p => !p.isOut && p.id !== striker && p.id !== nonStriker);
    const isTeamAllOut = benchPlayers.length === 0 && isSoloPlay;
    const isGoingSoloNext = benchPlayers.length === 0 && !isSoloPlay;

    const recordBall = async (runs, isExtra = false, wicket = false, outBatsmanId = null, extraType = "", noStrikeChange = false) => {
        const matchRef = doc(db, "matches", matchId);

        let totalRunForBall = runs;
        if (isExtra && (extraType === "No Ball" || extraType === "Wide")) {
            totalRunForBall += 1;
        }

        const ballData = {
            striker, nonStriker, bowler: currentBowler, runs: totalRunForBall,
            isExtra, wicket, outBatsmanId, extraType,
            over: currentOver,
            ball: currentBall,
            noStrikeChange,
            runInput: runs
        };

        setBallHistory(prev => [...prev, ballData]);
        setBallLog(prev => [...prev, {
            over: currentOver, ball: currentBall + 1, runs: totalRunForBall,
            runInput: runs, isExtra, wicket, extraType
        }]);

        const isLegalBall = !isExtra || (extraType !== "No Ball" && extraType !== "Wide");

        let newBall = isLegalBall ? currentBall + 1 : currentBall;
        let newOver = currentOver;
        let isOverComplete = false;

        if (isLegalBall && currentBall === 5) {
            newBall = 0;
            newOver = currentOver + 1;
            isOverComplete = true;
            if (newOver < match.overs && !wicket) {
                setModalContext("newBowler");
                setSelectedPlayerId("");
                setShowModal(true);
            }
        }

        let newStriker = striker;
        let newNonStriker = nonStriker;

        if (!isSoloPlay) {
            if (!noStrikeChange && runs % 2 === 1) {
                const temp = newStriker; newStriker = newNonStriker; newNonStriker = temp;
            }
            if (isOverComplete) {
                const temp = newStriker; newStriker = newNonStriker; newNonStriker = temp;
            }
        }

        await updateDoc(matchRef, {
            totalRuns: increment(totalRunForBall),
            currentBall: newBall,
            currentOver: newOver,
            wickets: wicket ? increment(1) : increment(0),
            striker: newStriker,
            nonStriker: newNonStriker
        });

        if (extraType !== "Wide") {
            await updateDoc(doc(db, `matches/${matchId}/players/${striker}`), {
                runs: increment(runs),
                balls: isLegalBall ? increment(1) : increment(1),
                fours: runs === 4 ? increment(1) : increment(0),
                sixes: runs === 6 ? increment(1) : increment(0)
            });
        }

        await updateDoc(doc(db, `matches/${matchId}/players/${currentBowler}`), {
            runsConceded: increment(totalRunForBall),
            ballsBowled: isLegalBall ? increment(1) : increment(0),
            wickets: wicket ? increment(1) : increment(0)
        });

        if (wicket && outBatsmanId) {
            await updateDoc(doc(db, `matches/${matchId}/players/${outBatsmanId}`), { isOut: true });
        }

        const snap = await getDoc(matchRef);
        setMatch({ id: snap.id, ...snap.data() });
    };

    const openModal = (context) => {
        setModalContext(context);
        setSelectedPlayerId("");
        setRunOutWho("striker");
        setNextStrikerChoice("new");

        // Reset Run Out specific state
        setRunOutBallType("legal");
        setRunOutRuns(0);

        setShowModal(true);
    };

    const confirmModal = async () => {
        const matchRef = doc(db, "matches", matchId);
        const isEndOfOver = currentBall === 5;
        const isMatchContinuing = currentOver + 1 < match.overs;

        if (modalContext === "wicket") {
            const outBatsmanId = striker;
            await recordBall(0, false, true, outBatsmanId);

            if (selectedPlayerId) {
                await updateDoc(matchRef, { striker: selectedPlayerId });
            } else {
                if (isGoingSoloNext) {
                    await updateDoc(matchRef, { striker: nonStriker, nonStriker: "" });
                } else if (isTeamAllOut) {
                    await updateDoc(matchRef, { striker: "" });
                }
            }

        } else if (modalContext === "runout") {
            const isStrikerOut = runOutWho === "striker";
            const outBatsmanId = isStrikerOut ? striker : nonStriker;
            const survivingBatsmanId = isStrikerOut ? nonStriker : striker;

            // --- Updated Extras Logic ---
            const isExtra = runOutBallType !== "legal";
            let extraLabel = "Run Out"; // Default label

            if (runOutBallType === "wide") extraLabel = "Wide";
            else if (runOutBallType === "noball") extraLabel = "No Ball";

            // Record Ball with user inputs (runs completed, correct extra type)
            await recordBall(runOutRuns, isExtra, true, outBatsmanId, extraLabel, true);

            // Update Batsmen
            if (isGoingSoloNext) {
                await updateDoc(matchRef, { striker: survivingBatsmanId, nonStriker: "" });
            } else if (isTeamAllOut) {
                await updateDoc(matchRef, { striker: "" });
            } else {
                let nextS, nextNS;
                if (nextStrikerChoice === "new") { nextS = selectedPlayerId; nextNS = survivingBatsmanId; }
                else { nextS = survivingBatsmanId; nextNS = selectedPlayerId; }
                await updateDoc(matchRef, { striker: nextS, nonStriker: nextNS });
            }

        } else if (modalContext === "newBowler") {
            await updateDoc(matchRef, { currentBowler: selectedPlayerId });
        }

        // Chaining Modals (Wicket/Runout -> New Bowler if Over ended)
        if ((modalContext === "wicket" || modalContext === "runout") && isEndOfOver && isMatchContinuing && !isTeamAllOut) {
            setModalContext("newBowler");
            setSelectedPlayerId("");
        } else {
            setShowModal(false);
        }

        const snap = await getDoc(matchRef);
        setMatch({ id: snap.id, ...snap.data() });
    };

    const undoLastBall = async () => {
        if (ballHistory.length === 0) return;
        const lastBall = ballHistory[ballHistory.length - 1];
        const matchRef = doc(db, "matches", matchId);
        const wasLegalBall = !lastBall.isExtra || (lastBall.extraType !== "No Ball" && lastBall.extraType !== "Wide");
        const revertOver = lastBall.over !== undefined ? lastBall.over : 0;
        const revertBall = lastBall.ball !== undefined ? lastBall.ball : 0;

        await updateDoc(matchRef, {
            totalRuns: increment(-lastBall.runs),
            currentOver: revertOver,
            currentBall: revertBall,
            wickets: lastBall.wicket ? increment(-1) : increment(0),
            striker: lastBall.striker,
            nonStriker: lastBall.nonStriker
        });

        if (lastBall.extraType !== "Wide") {
            await updateDoc(doc(db, `matches/${matchId}/players/${lastBall.striker}`), {
                runs: increment(-lastBall.runInput),
                balls: increment(-1),
                fours: lastBall.runInput === 4 ? increment(-1) : increment(0),
                sixes: lastBall.runInput === 6 ? increment(-1) : increment(0)
            });
        }
        await updateDoc(doc(db, `matches/${matchId}/players/${lastBall.bowler}`), {
            runsConceded: increment(-lastBall.runs),
            ballsBowled: wasLegalBall ? increment(-1) : increment(0),
            wickets: lastBall.wicket ? increment(-1) : increment(0)
        });
        if (lastBall.wicket && lastBall.outBatsmanId) {
            await updateDoc(doc(db, `matches/${matchId}/players/${lastBall.outBatsmanId}`), { isOut: false });
        }
        setBallHistory(prev => prev.slice(0, -1));
        setBallLog(prev => prev.slice(0, -1));
        const snap = await getDoc(matchRef);
        setMatch({ id: snap.id, ...snap.data() });
    };

    const showDropdown = modalContext === "newBowler" || (!isGoingSoloNext && !isTeamAllOut && (modalContext === "wicket" || modalContext === "runout"));

    return (
        <div className="scoring-app-container">
            <div className="score-header">
                <div className="match-label">
                    {match?.innings === 2 ? `2nd INNINGS (Target: ${match?.target})` : "1st INNINGS"}
                </div>
                <div className="main-display">
                    <span className="runs">{totalRuns}-{wickets}</span>
                    <span className="overs">({currentOver}.{currentBall})</span>
                </div>
            </div>

            <div className="timeline-container">
                <div className="ball-strip">
                    {ballLog.slice(-10).reverse().map((b, i) => (
                        <div key={i} className={`ball-item ${b.wicket ? 'wicket' : b.runs >= 4 ? 'boundary' : ''}`}>
                            {getBallDisplay(b)}
                        </div>
                    ))}
                    {ballLog.length === 0 && <span className="empty-msg">No balls recorded</span>}
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card batting">
                    {isSoloPlay && <div className="badge bg-warning text-dark mb-2">Solo Play Enabled</div>}
                    <div className={`player-line ${strikerPlayer ? 'on-strike' : ''}`}>
                        <span className="p-name">{strikerPlayer?.name || (isTeamAllOut ? 'ALL OUT' : 'Select Batsman')} *</span>
                        <span className="p-score">{strikerPlayer?.runs || 0}({strikerPlayer?.balls || 0})</span>
                    </div>
                    {!isSoloPlay && (
                        <div className="player-line">
                            <span className="p-name">{nonStrikerPlayer?.name || 'Select Batsman'}</span>
                            <span className="p-score">{nonStrikerPlayer?.runs || 0}({nonStrikerPlayer?.balls || 0})</span>
                        </div>
                    )}
                </div>
                <div className="dashboard-card bowling">
                    <div className="player-line">
                        <span className="p-name">{bowlerPlayer?.name || 'Select Bowler'}</span>
                        <span className="p-score">
                            {bowlerPlayer?.wickets || 0}-{bowlerPlayer?.runsConceded || 0} ({formatOvers(bowlerPlayer?.ballsBowled || 0)})
                        </span>
                    </div>
                </div>
            </div>

            <div className="controls-section">
                <div className="run-grid">
                    {[0, 1, 2, 3, 4, 6].map(run => (
                        <button key={run} className={`control-btn run-btn r-${run}`} onClick={() => recordBall(run)}>
                            {run}
                        </button>
                    ))}
                </div>
                <div className="extra-grid">
                    <button className="control-btn extra-btn" onClick={() => setShowNoBallModal(true)}>NB</button>
                    <button className="control-btn extra-btn" onClick={() => recordBall(0, true, false, null, "Wide", true)}>WD</button>
                    <button className="control-btn extra-btn" onClick={() => openModal("runout")}>Run Out</button>
                    <button className="control-btn wicket-btn" onClick={() => openModal("wicket")}>WICKET</button>
                </div>
                <div className="utility-grid">
                    <button className="control-btn util-btn" onClick={() => recordBall(1, false, false, null, "", true)}>1 (No Swap)</button>
                    <button className="control-btn util-btn undo" onClick={undoLastBall} disabled={ballHistory.length === 0}>Undo</button>
                </div>
            </div>

            {/* MODAL 1: END OF INNINGS */}
            {showInningsBreakModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <h4>Innings Complete</h4>
                        <p className="my-3">
                            The first innings has ended.<br />
                            <strong>Score: {totalRuns}/{wickets}</strong><br />
                            <strong>Target: {(totalRuns || 0) + 1}</strong>
                        </p>
                        <button className="btn btn-primary w-100 mt-2" onClick={startNextInnings}>
                            Start 2nd Innings
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 2: END OF MATCH */}
            {showMatchEndModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <h2 className="text-success fw-bold">Match Over!</h2>
                        <h4 className="my-3">{matchResult}</h4>
                        <p className="text-muted">
                            Final Score: {totalRuns}/{wickets}
                        </p>
                        <button className="btn btn-success w-100 mt-3" onClick={finishMatch}>
                            View Scorecard
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 3: PLAYER SELECTION / EVENTS */}
            {showModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <h4>
                            {modalContext === "newBowler" && "Change Bowler"}
                            {modalContext === "wicket" && (isTeamAllOut ? "All Out!" : isGoingSoloNext ? "Last Man Standing" : "New Batsman")}
                            {modalContext === "runout" && "Run Out Details"}
                        </h4>

                        {modalContext === "runout" && (
                            <>
                                <div className="mb-3 text-start">
                                    <label className="form-label fw-bold">1. Who is Out?</label>
                                    {isSoloPlay ? (
                                        <div className="alert alert-warning">Solo Batsman <strong>{strikerPlayer?.name}</strong> is Run Out.</div>
                                    ) : (
                                        <div className="d-flex gap-3 mb-3">
                                            <div className="form-check">
                                                <input className="form-check-input" type="radio" name="whoOut" checked={runOutWho === "striker"} onChange={() => setRunOutWho("striker")} />
                                                <label className="form-check-label">{strikerPlayer?.name} (Striker)</label>
                                            </div>
                                            <div className="form-check">
                                                <input className="form-check-input" type="radio" name="whoOut" checked={runOutWho === "nonStriker"} onChange={() => setRunOutWho("nonStriker")} />
                                                <label className="form-check-label">{nonStrikerPlayer?.name} (Non-Striker)</label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3 text-start border-top pt-3">
                                    <label className="form-label fw-bold">2. Delivery Details</label>
                                    <div className="d-flex gap-3 mb-2">
                                        <div className="form-check">
                                            <input className="form-check-input" type="radio" name="roType" checked={runOutBallType === "legal"} onChange={() => setRunOutBallType("legal")} />
                                            <label className="form-check-label">Legal Ball</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="radio" name="roType" checked={runOutBallType === "wide"} onChange={() => setRunOutBallType("wide")} />
                                            <label className="form-check-label">Wide</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="radio" name="roType" checked={runOutBallType === "noball"} onChange={() => setRunOutBallType("noball")} />
                                            <label className="form-check-label">No Ball</label>
                                        </div>
                                    </div>
                                    <div className="input-group input-group-sm mb-2" style={{ maxWidth: "200px" }}>
                                        <span className="input-group-text">Runs Completed</span>
                                        <input type="number" className="form-control" value={runOutRuns} onChange={(e) => setRunOutRuns(Math.max(0, Number(e.target.value)))} />
                                    </div>
                                    <small className="text-muted">(Enter runs completed. If Wide/NB, extra run is added automatically)</small>
                                </div>
                            </>
                        )}

                        {isGoingSoloNext && (modalContext === "wicket" || modalContext === "runout") && (
                            <div className="alert alert-info">No more players left! The survivor will play <strong>Solo</strong>.</div>
                        )}

                        {showDropdown && (
                            <>
                                <label className="form-label fw-bold">{modalContext === "runout" ? "3. Select New Batsman" : "Select Player"}</label>
                                <select className="form-select mb-3" value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)}>
                                    <option value="">Select Player</option>
                                    {modalContext === "newBowler"
                                        ? bowlingTeamPlayers.filter(p => p.id !== currentBowler).map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                                        : benchPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                                    }
                                </select>
                            </>
                        )}

                        {modalContext === "runout" && selectedPlayerId && !isGoingSoloNext && !isTeamAllOut && (
                            <div className="mb-3 text-start">
                                <label className="form-label fw-bold">4. Who takes strike next?</label>
                                <div className="d-flex flex-column gap-2">
                                    <div className="form-check">
                                        <input className="form-check-input" type="radio" name="nextStrike" checked={nextStrikerChoice === "new"} onChange={() => setNextStrikerChoice("new")} />
                                        <label className="form-check-label">New Player</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="radio" name="nextStrike" checked={nextStrikerChoice === "existing"} onChange={() => setNextStrikerChoice("existing")} />
                                        <label className="form-check-label">{runOutWho === "striker" ? nonStrikerPlayer?.name : strikerPlayer?.name} (Existing)</label>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="d-flex gap-2 mt-4">
                            <button className="btn btn-primary flex-grow-1" onClick={confirmModal} disabled={!selectedPlayerId && !isGoingSoloNext && !isTeamAllOut}>Confirm</button>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showNoBallModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <h4>No Ball</h4>
                        <input type="number" className="form-control my-3" placeholder="Runs OFF BAT" value={noBallRuns} onChange={(e) => setNoBallRuns(Number(e.target.value))} />
                        <button className="btn btn-success w-100" onClick={() => { recordBall(noBallRuns, true, false, null, "No Ball"); setShowNoBallModal(false); setNoBallRuns(0); }}>Submit</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveScoring;