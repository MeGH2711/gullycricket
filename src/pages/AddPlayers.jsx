import { useEffect, useState } from "react";
// Added deleteDoc to imports
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
// Added MdDeleteOutline
import { MdPersonAdd, MdEdit, MdCheck, MdClose, MdPeopleOutline, MdSearch, MdDeleteOutline } from "react-icons/md";
import "../App.css";

const AddPlayers = () => {
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const q = query(collection(db, "players"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "players"), {
        name: playerName.trim(),
        createdAt: new Date()
      });
      setPlayerName("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (player) => {
    setEditingId(player.id);
    setEditName(player.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;

    try {
      const playerRef = doc(db, "players", id);
      await updateDoc(playerRef, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
    } catch (error) {
      console.error("Error updating player:", error);
      alert("Failed to update player name");
    }
  };

  // --- NEW: Delete Function ---
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the roster?`)) {
      try {
        await deleteDoc(doc(db, "players", id));
      } catch (error) {
        console.error("Error deleting player:", error);
        alert("Failed to delete player");
      }
    }
  };

  return (
    <div className="container player-page-container">
      {/* --- Embedded CSS for this Page --- */}
      <style>{`
        .player-page-container {
          max-width: 800px;
          margin: 0 auto;
          padding-top: 2rem;
        }

        /* Input Card Styling */
        .add-card {
          background: linear-gradient(145deg, var(--bg-input) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .input-wrapper {
          flex: 1 1 auto; 
          width: 100%; 
          display: flex;
          align-items: center;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border);
          padding: 0 15px;
          border-radius: 8px;
          height: 50px;
          transition: border-color 0.2s;
        }

        .input-wrapper:focus-within {
          border-color: var(--accent);
        }

        .pro-input {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.1rem;
          width: 100%;
          outline: none;
        }
        
        .pro-input::placeholder {
          color: var(--text-muted);
          opacity: 0.7;
        }

        .submit-btn {
          height: 50px;
          padding: 0 2rem;
          border-radius: 8px;
          font-weight: 600;
          white-space: nowrap; 
          width: auto !important;
          flex: 0 0 auto;
        }

        /* List Styling */
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0 0.5rem;
        }

        .roster-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .player-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.2s;
        }

        .player-row:last-child {
          border-bottom: none;
        }

        .player-row:hover {
          background: rgba(255,255,255,0.02);
        }

        .index-badge {
          font-size: 0.8rem;
          color: var(--text-muted);
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
          margin-right: 1rem;
          min-width: 30px;
          text-align: center;
        }

        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .icon-btn.save { color: var(--accent); }
        .icon-btn.save:hover { background: rgba(34, 197, 94, 0.15); }
        
        .icon-btn.cancel { color: #ef4444; }
        .icon-btn.cancel:hover { background: rgba(239, 68, 68, 0.15); }

        .icon-btn.delete:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>

      {/* --- Header Section --- */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdPeopleOutline color="var(--accent)" />
          Team Roster
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage your squad database. Add new talent or edit existing profiles.</p>
      </div>

      {/* --- Add Player Card --- */}
      <form onSubmit={handleSubmit} className="add-card">
        <div className="input-wrapper">
          <MdPersonAdd style={{ color: 'var(--text-muted)', marginRight: '10px' }} size={22} />
          <input
            className="pro-input"
            placeholder="Enter player name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary submit-btn"
          disabled={loading || !playerName.trim()}
        >
          {loading ? "Adding..." : "Add Player"}
        </button>
      </form>

      {/* --- Stats Header --- */}
      <div className="list-header">
        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Registered Players</span>
        <span style={{
          background: 'var(--accent)',
          color: '#000',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 'bold'
        }}>
          {players.length} Total
        </span>
      </div>

      {/* --- Player List --- */}
      <div className="roster-card">
        {players.length === 0 ? (
          <div className="empty-state">
            <MdSearch size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>No players found in the roster.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {players.map((player, index) => (
              <div key={player.id} className="player-row">

                {editingId === player.id ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '10px' }}>
                      <span className="index-badge">#{index + 1}</span>
                      <input
                        className="pro-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        style={{ borderBottom: '1px solid var(--accent)', paddingBottom: '4px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="icon-btn save" onClick={() => handleUpdate(player.id)} title="Save">
                        <MdCheck size={20} />
                      </button>
                      <button className="icon-btn cancel" onClick={cancelEditing} title="Cancel">
                        <MdClose size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="index-badge">#{index + 1}</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: '500' }}>{player.name}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="icon-btn"
                        onClick={() => startEditing(player)}
                        title="Edit Name"
                      >
                        <MdEdit size={18} />
                      </button>

                      {/* Delete Button */}
                      <button
                        className="icon-btn delete"
                        onClick={() => handleDelete(player.id, player.name)}
                        title="Delete Player"
                      >
                        <MdDeleteOutline size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPlayers;