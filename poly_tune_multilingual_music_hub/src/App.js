import React, { useState } from 'react';
import './App.css';

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
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
            <button className="btn">Template Button</button>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <div className="hero">
            <div className="subtitle">AI Workflow Manager Template</div>
            <h1 className="title">poly_tune_multilingual_music_hub</h1>
            <div className="description">
              Start building your application.
            </div>
            <button className="btn btn-large">Button</button>
          </div>
          {/* Lyrics fetcher in main container */}
          <LyricsFetcher />
        </div>
      </main>
    </div>
  );
}

export default App;