import React, { useState } from 'react';
import './App.css';
import LoginPage from "./LoginPage";

/**
 * Openwhyd API utility for working with session and playlists.
 * Documented at https://openwhyd.github.io/openwhyd/API .
 */
const OPENWHYD_API_BASE = "https://openwhyd.org";

/* --- PUBLIC_INTERFACE --- */
function OpenwhydAuth({ onAuth }) {
  /**
   * Handles basic Openwhyd user authentication.
   * Calls onAuth({sid, userId, username}) upon successful login.
   * In production, never store passwords in client-side code.
   */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authInfo, setAuthInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Openwhyd login API via POST. Response headers set cookie 'whydSid'
      // CORS: We use credentials, so server must support CORS.
      const resp = await fetch(`${OPENWHYD_API_BASE}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `email=${encodeURIComponent(username)}&md5=${encodeURIComponent(password)}`
      });
      if (!resp.ok) throw new Error('Login failed');
      // Fetch session info
      const info = await resp.json();
      setAuthInfo(info);
      onAuth(info); // pass sessionId etc to parent
    } catch (ex) {
      setError("Could not log in. Check your Openwhyd username/email and password.");
      setAuthInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(0,35,70,0.10)', borderRadius: 8, padding: 20, marginTop: 32, marginBottom: 16
    }}>
      <h3>Login to Openwhyd</h3>
      <form style={{display:'flex', flexDirection:'column', gap:8}} onSubmit={login}>
        <input
          type="text"
          placeholder="Openwhyd username or email"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
          style={{padding:8, borderRadius:5}}
        />
        <input
          type="password"
          placeholder="Openwhyd password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{padding:8, borderRadius:5}}
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {error && <div style={{color:"#ff5c72", marginTop:6}}>{error}</div>}
      {authInfo && <div style={{color:"#8aff6c", marginTop:6}}>Logged in as {authInfo.name || authInfo.id}!</div>}
    </div>
  );
}

/* --- PUBLIC_INTERFACE --- */
function YoutubePlaylistCreator({ session, onLogout }) {
  /**
   * UI for creating playlists and adding YouTube videos using Openwhyd API (requires login).
   * Allows:
   * - (1) Searching/entering YouTube URLs
   * - (2) Viewing existing playlists, or creating a new playlist
   * - (3) Adding the chosen YT videos to a playlist
   * - Shows feedback on success/failure.
   */
  const [playlists, setPlaylists] = useState([]);
  const [fetchingPlaylists, setFetchingPlaylists] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [selectedPlId, setSelectedPlId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  // Fetch Openwhyd playlists for the logged in user
  const fetchPlaylists = async () => {
    setFetchingPlaylists(true);
    setError("");
    try {
      const userId = session._id || session.id;
      const resp = await fetch(`${OPENWHYD_API_BASE}/api/user`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type":"application/x-www-form-urlencoded"},
        body: `id=${encodeURIComponent(userId)}`,
      });
      if (!resp.ok) throw new Error("Failed to load playlists");
      const info = await resp.json();
      setPlaylists(Array.isArray(info.playlists) ? info.playlists : []);
    } catch (ex) {
      setError("Error while loading your playlists.");
    } finally {
      setFetchingPlaylists(false);
    }
  };

  React.useEffect(() => { 
    fetchPlaylists();
    // eslint-disable-next-line
  }, []);

  // Create a new playlist in Openwhyd
  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistTitle) return;
    setStatus("Creating playlist...");
    setError("");
    try {
      const resp = await fetch(`${OPENWHYD_API_BASE}/api/playlist`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type":"application/x-www-form-urlencoded"},
        body: `action=create&name=${encodeURIComponent(newPlaylistTitle)}`
      });
      if (!resp.ok) throw new Error("Failed to create playlist");
      const data = await resp.json();
      setStatus("Created playlist.");
      setNewPlaylistTitle("");
      setPlaylists([...playlists, data]); // Optimistically add
      setSelectedPlId(data._id);
    } catch (ex) {
      setError("Failed to create playlist.");
    } finally {
      setStatus("");
    }
  };

  // Add a YouTube video to selected playlist
  const addToPlaylist = async (e) => {
    e.preventDefault();
    if (!ytUrl) {
      setError("You must provide a YouTube URL.");
      return;
    }
    if (!selectedPlId) {
      setError("You must select or create a playlist.");
      return;
    }
    setAdding(true);
    setError("");
    setStatus("Adding track...");
    // Openwhyd expects /api/post (see: https://openwhyd.github.io/openwhyd/API#post-track )
    const urlParams = new URLSearchParams({
      action: "insert",
      pl: selectedPlId,
      eId: `/yt/${extractYoutubeId(ytUrl)}`,
      name: "YouTube track"
    });
    try {
      const resp = await fetch(`${OPENWHYD_API_BASE}/api/post`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type":"application/x-www-form-urlencoded"},
        body: urlParams.toString(),
      });
      if (!resp.ok) throw new Error("Failed to add video");
      setStatus("Added video to playlist!");
      setYtUrl("");
    } catch (ex) {
      setError("Error adding YouTube video to playlist.");
    } finally {
      setAdding(false);
    }
  };

  // Extract YouTube video ID for Openwhyd API (returns null if not found)
  // PUBLIC_INTERFACE
  function extractYoutubeId(url) {
    try {
      // Handle various YT URL forms
      const re = /(?:youtube\.com.*(?:v=|\/embed\/)|youtu\.be\/)([A-Za-z0-9_\-]{11})/;
      const match = url.match(re);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  return (
    <div style={{background:'rgba(0,0,0,0.12)', borderRadius:10,padding:18,marginTop:32}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0, color:"var(--base-light)"}}>YouTube Playlist Creator (Openwhyd)</h2>
        <button className="btn" style={{fontSize:'1em'}} onClick={onLogout}>Log out</button>
      </div>
      <div style={{marginTop:12}}>
        <form style={{display:'flex', gap:8, flexWrap:'wrap'}} onSubmit={addToPlaylist}>
          <input
            type="url"
            placeholder="Paste YouTube video URL here"
            value={ytUrl}
            onChange={e => setYtUrl(e.target.value)}
            style={{flex:3, padding:8, borderRadius:5}}
          />
          <select
            value={selectedPlId}
            style={{flex:2, padding:8, borderRadius:5}}
            onChange={e => setSelectedPlId(e.target.value)}
            disabled={fetchingPlaylists}
          >
            <option value="">Select a playlist...</option>
            {playlists.map(pl => (
              <option key={pl._id} value={pl._id}>{pl.name}</option>
            ))}
          </select>
          <button className="btn" type="submit" disabled={adding || fetchingPlaylists}>
            {adding ? "Adding..." : "Add to Playlist"}
          </button>
        </form>
        <form style={{marginTop:10, display:'flex', gap:5}} onSubmit={createPlaylist}>
          <input
            type="text"
            placeholder="Create new playlist"
            value={newPlaylistTitle}
            onChange={e => setNewPlaylistTitle(e.target.value)}
            style={{padding:8, borderRadius:5}}
          />
          <button className="btn" type="submit">Create</button>
        </form>
        <div style={{minHeight:'1em', color:'#ffd980',marginTop:4}}>{status}</div>
        {error && <div style={{color:'#ff6570',marginTop:4}}>{error}</div>}
      </div>
      {playlists.length > 0 && (
        <div style={{marginTop:20}}>
          <strong>Your Playlists:</strong>
          <ul>
            {playlists.map(pl => (
              <li key={pl._id}>{pl.name} (ID: {pl._id})</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{marginTop:12,fontSize:'.95em',color:'var(--text-secondary)'}}>Openwhyd account required. YT only, supported via Openwhyd API.</div>
    </div>
  );
}
// PUBLIC_INTERFACE
function LyricsFetcher() {
  /**
   * Fetches lyrics from the lyrics.ovh API for a given artist and title.
   * Displays loading, error, and lyrics states.
   */
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  const fetchLyrics = async (e) => {
    e.preventDefault();
    setLyrics('');
    setError('');
    if (!artist || !title) {
      setError('Please enter both artist and title.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
      if (!resp.ok) {
        throw new Error('Lyrics not found');
      }
      const data = await resp.json();
      setLyrics(data.lyrics || 'No lyrics available.');
    } catch (err) {
      setError('Could not fetch lyrics for this song.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      marginTop: 40, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 24, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto'
    }}>
      <h2 style={{ color: 'var(--base-light)' }}>Get Song Lyrics</h2>
      <form onSubmit={fetchLyrics} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="text"
          placeholder="Artist"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid var(--border-color)' }}
        />
        <input
          type="text"
          placeholder="Song Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid var(--border-color)' }}
        />
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Fetching...' : 'Fetch Lyrics'}</button>
      </form>
      {error && <div style={{ color: '#ff6666', marginTop: 8 }}>{error}</div>}
      {lyrics && (
        <pre
          style={{
            marginTop: 16,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 6,
            padding: 16,
            whiteSpace: 'pre-wrap',
            color: 'var(--text-color)',
            maxHeight: 320,
            overflowY: 'auto'
          }}
        >{lyrics}</pre>
      )}
    </div>
  );
}

function App() {
  // Controls main UI mode
  const [showWhyd, setShowWhyd] = useState(false);
  const [whydSession, setWhydSession] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);

  // Receives info from LoginPage on successful login
  const handleSuccessfulLogin = (sessionInfo) => {
    setIsAuthed(true);
    // Optionally store more info for future expansion
    setWhydSession(sessionInfo);
  };

  const handleAuth = (sessionInfo) => {
    setWhydSession(sessionInfo);
  };
  const handleLogout = () => {
    setWhydSession(null);
    setIsAuthed(false);
    // Attempt Openwhyd logout (if supported)
    window.fetch(`${OPENWHYD_API_BASE}/logout`, {credentials:"include",mode:"cors"});
  };

  // If not authenticated, always show LoginPage first
  if (!isAuthed) {
    return <LoginPage onLogin={handleSuccessfulLogin} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
            <button
              className="btn"
              onClick={() => setShowWhyd(show => !show)}
            >
              {showWhyd ? "Show Lyrics Tool" : "YouTube Playlist (Openwhyd)"}
            </button>
            <button
              className="btn"
              style={{marginLeft:12}}
              onClick={handleLogout}
            >Log out</button>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <div className="hero">
            <div className="subtitle">AI Workflow Manager Template</div>
            <h1 className="title">poly_tune_multilingual_music_hub</h1>
            <div className="description">
              {showWhyd
                ? "Create YouTube playlists and manage them through Openwhyd. Requires Openwhyd account."
                : "Start building your application or fetch lyrics for any song!"}
            </div>
            <button className="btn btn-large"
                onClick={() => setShowWhyd(show => !show)}
            >
              {showWhyd ? "Show Lyrics Tool" : "YouTube Playlist Creator"}
            </button>
          </div>
          {/* Conditionally show Openwhyd Playlist Creator or Lyrics */}
          {showWhyd ? (
            !whydSession
              ? <OpenwhydAuth onAuth={handleAuth} />
              : <YoutubePlaylistCreator session={whydSession} onLogout={handleLogout} />
          ) : (
            <LyricsFetcher />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;