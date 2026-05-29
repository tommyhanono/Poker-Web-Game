import { useState } from 'react';
import socket from '../socket';

const AVATARS = ['🦁','🐯','🦊','🐺','🐻','🦝','🐸','🦈','🦅','🐲','👾','🤠','🎩','😈','🤖','🦄'];

export default function Lobby({ onJoined }) {
  const [view,      setView]      = useState('home');
  const [hostName,  setHostName]  = useState('');
  const [joinCode,  setJoinCode]  = useState('');
  const [joinName,  setJoinName]  = useState('');
  const [avatar,    setAvatar]    = useState('🦁');
  const [gameMode,  setGameMode]  = useState('holdem');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const createRoom = () => {
    if (!hostName.trim()) return setError('Enter your name');
    setLoading(true);
    socket.emit('create_room', { playerName: hostName.trim(), gameMode, avatar }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onJoined({ roomCode: res.roomCode, playerId: res.playerId, isHost: true });
    });
  };

  const joinRoom = () => {
    if (!joinName.trim()) return setError('Enter your name');
    if (!joinCode.trim()) return setError('Enter room code');
    setLoading(true);
    socket.emit('join_room', { roomCode: joinCode.trim().toUpperCase(), playerName: joinName.trim(), avatar }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onJoined({ roomCode: joinCode.trim().toUpperCase(), playerId: res.playerId, isHost: false });
    });
  };

  const AvatarPicker = () => (
    <div>
      <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Your Avatar</label>
      <div className="grid grid-cols-8 gap-1.5">
        {AVATARS.map(e => (
          <button
            key={e}
            onClick={() => setAvatar(e)}
            className="text-xl rounded-lg p-1.5 transition-all"
            style={{
              background: avatar === e ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)',
              border: avatar === e ? '2px solid var(--gold)' : '2px solid transparent',
              transform: avatar === e ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="felt-bg flex flex-col items-center justify-center min-h-screen p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-black tracking-wider"
            style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', color: 'var(--gold)', textShadow: '0 0 40px var(--gold-glow)' }}>
          ♠ POKER ♠
        </h1>
        <p className="text-gray-400 mt-1 text-sm tracking-widest uppercase">
          Multiplayer · Texas Hold'em &amp; Omaha
        </p>
      </div>

      {/* Home */}
      {view === 'home' && (
        <div className="panel p-8 w-full max-w-sm flex flex-col gap-4">
          <button className="btn-action btn-primary text-xl py-4 w-full" onClick={() => setView('create')}>
            🎰 Create Room
          </button>
          <button className="btn-action btn-secondary text-xl py-4 w-full" onClick={() => setView('join')}>
            🚪 Join Room
          </button>
        </div>
      )}

      {/* Create */}
      {view === 'create' && (
        <div className="panel p-8 w-full max-w-sm flex flex-col gap-5">
          <h2 className="text-2xl font-black text-center" style={{ color: 'var(--gold)' }}>Create Room</h2>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Your Name</label>
            <input
              className="input-field text-base"
              placeholder="Enter your name"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createRoom()}
              maxLength={20}
            />
          </div>

          <AvatarPicker />

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Game Mode</label>
            <div className="flex gap-2">
              {['holdem', 'omaha'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                    gameMode === mode
                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                      : 'border-white/20 bg-black/30 text-gray-400 hover:border-white/40'
                  }`}
                >
                  {mode === 'holdem' ? "Texas Hold'em" : 'Pot-Limit Omaha'}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button className="btn-action btn-primary w-full py-3 text-base" onClick={createRoom} disabled={loading}>
            {loading ? 'Creating…' : 'Create Room'}
          </button>
          <button className="btn-action btn-secondary w-full py-2" onClick={() => { setView('home'); setError(''); }}>
            ← Back
          </button>
        </div>
      )}

      {/* Join */}
      {view === 'join' && (
        <div className="panel p-8 w-full max-w-sm flex flex-col gap-5">
          <h2 className="text-2xl font-black text-center" style={{ color: 'var(--gold)' }}>Join Room</h2>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Your Name</label>
            <input
              className="input-field text-base"
              placeholder="Enter your name"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              maxLength={20}
            />
          </div>

          <AvatarPicker />

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Room Code</label>
            <input
              className="input-field text-center text-2xl font-mono tracking-widest uppercase"
              placeholder="XXXXXX"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinRoom()}
              maxLength={6}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button className="btn-action btn-primary w-full py-3 text-base" onClick={joinRoom} disabled={loading}>
            {loading ? 'Joining…' : 'Join Room'}
          </button>
          <button className="btn-action btn-secondary w-full py-2" onClick={() => { setView('home'); setError(''); }}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
