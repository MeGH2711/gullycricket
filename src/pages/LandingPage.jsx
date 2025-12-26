import React from "react";
import { useNavigate } from "react-router-dom";
// Importing icons from 'react-icons'
import { MdSportsCricket, MdHistory, MdPeopleOutline, MdAddCircleOutline } from "react-icons/md";
import { FaTrophy } from "react-icons/fa";
import "../App.css";

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={styles.container}>

            {/* --- Hero Section --- */}
            <div style={styles.hero}>
                <div style={styles.logoCircle}>
                    <MdSportsCricket size={40} color="white" />
                </div>
                <h1 style={styles.title}>CricScorer</h1>
                <p style={styles.subtitle}>
                    Professional Match Management & Live Scoring
                </p>
            </div>

            {/* --- Main Action Grid --- */}
            <div style={styles.grid}>

                {/* Card 1: New Match (Featured) */}
                <div
                    className="card hover-card"
                    onClick={() => navigate("/new-match")}
                    style={{ ...styles.card, border: '1px solid var(--accent)' }}
                >
                    <div style={{ ...styles.iconBox, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent)' }}>
                        <MdAddCircleOutline size={32} />
                    </div>
                    <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}>Start New Match</h3>
                        <p style={styles.cardText}>Setup teams, toss details, and begin live scoring.</p>
                    </div>
                </div>

                {/* Card 2: Match History */}
                <div
                    className="card hover-card"
                    onClick={() => navigate("/matches")}
                    style={styles.card}
                >
                    <div style={{ ...styles.iconBox, background: '#3b82f626', color: '#3b82f6' }}>
                        <MdHistory size={32} />
                    </div>
                    <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}>Match History</h3>
                        <p style={styles.cardText}>View live scores, past results, and scorecards.</p>
                    </div>
                </div>

                {/* Card 3: Players */}
                <div
                    className="card hover-card"
                    onClick={() => navigate("/players")}
                    style={styles.card}
                >
                    <div style={{ ...styles.iconBox, background: '#a855f726', color: '#a855f7' }}>
                        <MdPeopleOutline size={32} />
                    </div>
                    <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}>Manage Squad</h3>
                        <p style={styles.cardText}>Add new players or update your team roster.</p>
                    </div>
                </div>

            </div>

            {/* --- Footer / Mini Stats --- */}
            <div style={styles.footer}>
                <div style={styles.footerItem}>
                    <span>Developed & Designed with 💙 by Megh Patel</span>
                </div>
            </div>

        </div>
    );
};

// Internal Styling Object
const styles = {
    container: {
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '20px',
    },
    hero: {
        textAlign: 'center',
        marginBottom: '3rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    logoCircle: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'var(--accent)', // Uses your green from App.css
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: '800',
        marginBottom: '0.5rem',
        letterSpacing: '-1px',
    },
    subtitle: {
        color: 'var(--text-muted)',
        fontSize: '1.1rem',
        maxWidth: '400px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
    },
    card: {
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        gap: '1rem',
    },
    iconBox: {
        width: '50px',
        height: '50px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    cardTitle: {
        fontSize: '1.2rem',
        fontWeight: '600',
        margin: 0,
    },
    cardText: {
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        margin: 0,
        lineHeight: '1.5',
    },
    footer: {
        marginTop: '4rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        paddingTop: '2rem',
    },
    footerItem: {
        display: 'inline-flex',
        alignItems: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        background: 'var(--bg-input)',
        padding: '8px 16px',
        borderRadius: '20px',
    }
};

export default LandingPage;