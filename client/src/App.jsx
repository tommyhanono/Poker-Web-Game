import { useState, useEffect } from 'react';
import socket from './socket';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import GameTable from './components/GameTable';
import AdminPanel from './components/AdminPanel';
import ThemeToggle, { useTheme } from './components/ThemeToggle';

const SESSION_KEY = 'poker_session';

export default function App() {
  const { theme, toggle } = useTheme();
  const [session, setSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  });
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('room_update', (roomState) => setRoom(roomState));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_update');
    };
  }, []);

  // Rejoin on mount if session exists
  useEffect(() => {
    if (!session) return;
    socket.emit('rejoin_room', { roomCode: session.roomCode, playerId: session.playerId }, (res) => {
      if (res.error) {
        sessionStorage.removeItem(SESSION_KEY);
        setSession(null);
      } else {
        setRoom(res.roomState);
      }
    });
  }, []);

  const handleJoined = ({ roomCode, playerId, isHost }) => {
    const s = { roomCode, playerId, isHost };
    setSession(s);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    socket.emit('get_room', { roomCode, playerId }, (res) => {
      if (res.roomState) setRoom(res.roomState);
    });
  };

  const handleLeave = () => {
    setSession(null);
    setRoom(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const inGame = session && room;
  const isPlaying = room?.status === 'playing' || room?.status === 'hand_over';

  return (
    <div className={theme === 'modern' ? 'theme-modern' : ''}>
      {/* Theme toggle — always visible */}
      <div className="fixed top-2 right-2 z-50 flex items-center gap-2">
        <ThemeToggle theme={theme} onToggle={toggle} />
        {inGame && (
          <button className="btn-action btn-secondary text-xs px-2 py-1" onClick={handleLeave}>Leave</button>
        )}
        {!connected && (
          <span className="text-xs text-red-400 font-bold animate-pulse">Disconnected</span>
        )}
      </div>

      {!inGame && <Lobby onJoined={handleJoined} />}

      {inGame && room && !isPlaying && (
        <WaitingRoom room={room} playerId={session.playerId} />
      )}

      {inGame && room && isPlaying && (
        <GameTable room={room} playerId={session.playerId} />
      )}

      {/* Admin panel — activated by Ctrl+Shift+A, no visible button */}
      <AdminPanel roomCode={session?.roomCode} playerId={session?.playerId} />
    </div>
  );
}
