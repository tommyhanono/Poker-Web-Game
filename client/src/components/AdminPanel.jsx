import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import { CardDisplay } from '../utils/cards.jsx';

const ADMIN_TOKEN_KEY = 'poker_admin_token';

export default function AdminPanel({ roomCode, playerId }) {
  const [visible, setVisible] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [adminRoom, setAdminRoom] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const inputRef = useRef(null);

  // Hidden keyboard shortcut: Ctrl+Shift+A
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (authenticated) {
          setVisible(v => !v);
        } else {
          setShowModal(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authenticated]);

  // Re-verify token from session
  useEffect(() => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      socket.emit('admin_verify', { token }, (res) => {
        if (res.success) {
          setAuthenticated(true);
          setVisible(true);
        } else {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        }
      });
    }
  }, []);

  // Poll admin room data when visible
  useEffect(() => {
    if (!authenticated || !visible || !roomCode) return;
    const fetch = () => {
      socket.emit('admin_get_room', { roomCode }, (res) => {
        if (res.roomState) setAdminRoom(res.roomState);
      });
    };
    fetch();
    const iv = setInterval(fetch, 2000);
    return () => clearInterval(iv);
  }, [authenticated, visible, roomCode]);

  const handleAuth = () => {
    socket.emit('admin_auth', { password }, (res) => {
      if (res.success) {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, res.token);
        setAuthenticated(true);
        setShowModal(false);
        setVisible(true);
        setPassword('');
        setError('');
      } else {
        setError('Invalid password');
      }
    });
  };

  if (showModal && !authenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="panel p-6 w-80">
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="password"
              className="input-field"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button className="btn-action btn-primary flex-1" onClick={handleAuth}>Enter</button>
              <button className="btn-action btn-secondary" onClick={() => { setShowModal(false); setPassword(''); setError(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated || !visible) return null;

  return (
    <div className="admin-panel scrollbar-thin">
      <div className="sticky top-0 flex items-center justify-between p-3 bg-black/80 border-b border-purple-700/50 z-10">
        <span className="text-purple-400 font-mono font-bold text-sm tracking-widest">ADMIN</span>
        <div className="flex gap-2">
          <button className="text-xs text-gray-400 hover:text-white transition-colors" onClick={() => setMinimized(m => !m)}>
            {minimized ? '▼' : '▲'}
          </button>
          <button className="text-xs text-gray-400 hover:text-white transition-colors" onClick={() => setVisible(false)}>✕</button>
        </div>
      </div>

      {!minimized && adminRoom && (
        <div className="p-3 flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Phase: <span className="text-purple-400">{adminRoom.phase || 'lobby'}</span></p>
            <p className="text-xs text-gray-500 mb-1">Pot: <span className="text-yellow-400 font-bold">{adminRoom.pot}</span></p>
          </div>

          {adminRoom.players?.map(p => (
            <div key={p.id} className="bg-white/5 rounded-lg p-2">
              <p className="text-xs font-bold text-white mb-1">{p.name} <span className="text-gray-400">({p.chips} chips)</span>
                {p.folded && <span className="ml-1 text-red-400">FOLDED</span>}
                {p.allIn && <span className="ml-1 text-yellow-400">ALL-IN</span>}
              </p>
              <div className="flex flex-wrap gap-1">
                {p.holeCards?.map((c, i) => (
                  <CardDisplay key={i} code={c} size="sm" />
                ))}
              </div>
            </div>
          ))}

          {adminRoom.remainingCommunityCards?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Upcoming community cards</p>
              <div className="flex flex-wrap gap-1">
                {adminRoom.remainingCommunityCards.map((c, i) => (
                  <CardDisplay key={i} code={c} size="sm" />
                ))}
              </div>
            </div>
          )}

          {adminRoom.communityCards?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Community cards</p>
              <div className="flex flex-wrap gap-1">
                {adminRoom.communityCards.map((c, i) => (
                  <CardDisplay key={i} code={c} size="sm" />
                ))}
              </div>
            </div>
          )}

          {adminRoom.fullDeck?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Full deck ({adminRoom.deckIndex} dealt)</p>
              <div className="flex flex-wrap gap-1 text-xs font-mono text-gray-400">
                {adminRoom.fullDeck.slice(adminRoom.deckIndex).map((c, i) => (
                  <span key={i} className="bg-white/10 px-1 rounded">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
