import { useState } from 'react';
import socket from '../socket';

export default function Lobby({ onJoined }) {
  const [view, setView] = useState('home'); // home | create | join
  const [hostName, setHostName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [gameMode, setGameMode] = useState('holdem');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createRoom = () => {
    if (!hostName.trim()) return setError('Enter your name');
    setLoading(true);
    socket.emit('create_room', { playerName: hostName.trim(), gameMode }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onJoined({ roomCode: res.roomCode, playerId: res.playerId, isHost: true });
    });
  };

  const joinRoom = () => {
    if (!joinName.trim()) return setError('Enter your name');
    if (!joinCode.trim()) return setError('Enter room code');
    setLoading(true);
    socket.emit('join_room', { roomCode: joinCode.trim().toUpperCase(), playerName: joinName.trim() }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onJoined({ roomCode: joinCode.trim().toUpperCase(), playerId: res.playerId, isHost: false });
    });
  };

  return (
    <div className="felt-bg flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black tracking-wider" style={{ color: 'var(--gold)', textShadow: '0 0 30px rgba(212,175,55,0.5)' }}>
          ♠ POKER ♠
        </h1>
        <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase">Multiplayer • Texas Hold'em & Omaha</p>
      </div>

      {view === 'home' && (
        <div className="panel p-8 w-full max-w-sm flex flex-col gap-4">
          <button className="btn-action btn-primary text-lg py-3 w-full" onClick={() => setView('create')}>
            Create Room
          </button>
          <button className="btn-action btn-secondary text-lg py-3 w-full" onClick={() => setView('join')}>
            Join Room
          </button>
        </div>
      )}

      {view === 'create' && (
        <div className="panel p-8 w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center" style={{ color: 'var(--gold)' }}>Create Room</h2>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Your Name</label>
            <input
              className="input-field"
              placeholder="Enter your name"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createRoom()}
              maxLength={20}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Game Mode</label>
            <div className="flex gap-2">
              {['holdem', 'omaha'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${
                    gameMode === mode
                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                      : 'border-white/20 bg-black/30 text-gray-400 hover:border-white/40'
                  }`}
                >
                  {mode === 'holdem' ? "Hold'em" : 'Omaha'}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button className="btn-action btn-primary w-full py-2.5" onClick={createRoom} disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
          <button className="btn-action btn-secondary w-full py-2" onClick={() => { setView('home'); setError(''); }}>
            Back
          </button>
        </div>
      )}

      {view === 'join' && (
        <div className="panel p-8 w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center" style={{ color: 'var(--gold)' }}>Join Room</h2>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Your Name</label>
            <input
              className="input-field"
              placeholder="Enter your name"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              maxLength={20}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Room Code</label>
            <input
              className="input-field text-center text-xl font-mono tracking-widest uppercase"
              placeholder="XXXXXX"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
              maxLength={6}
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button className="btn-action btn-primary w-full py-2.5" onClick={joinRoom} disabled={loading}>
            {loading ? 'Joining...' : 'Join Room'}
          </button>
          <button className="btn-action btn-secondary w-full py-2" onClick={() => { setView('home'); setError(''); }}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
