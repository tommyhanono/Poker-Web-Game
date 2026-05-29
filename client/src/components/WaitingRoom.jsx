import { useState } from 'react';
import socket from '../socket';

export default function WaitingRoom({ room, playerId }) {
  const isHost = room.hostId === playerId;
  const [editingId, setEditingId] = useState(null);
  const [editName,  setEditName]  = useState('');
  const [editChips, setEditChips] = useState('');

  const startGame = () => socket.emit('start_game');

  const saveEdit = (pid) => {
    socket.emit('update_player', {
      playerId: pid,
      name:  editName  || undefined,
      chips: editChips ? parseInt(editChips) : undefined,
    });
    setEditingId(null);
  };

  const setMode = (mode) => socket.emit('set_game_mode', { gameMode: mode });

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditChips(String(p.chips));
  };

  return (
    <div className="felt-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="panel p-7 w-full max-w-lg">

        {/* Room code */}
        <div className="text-center mb-7">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Room Code</p>
          <p className="font-black font-mono tracking-widest"
             style={{ fontSize: 'clamp(2.5rem,8vw,3.5rem)', color: 'var(--gold)', textShadow: '0 0 30px var(--gold-glow)' }}>
            {room.code}
          </p>
          <p className="text-gray-500 text-xs mt-1">Share this code to invite players</p>
        </div>

        {/* Game mode (host only) */}
        {isHost && (
          <div className="mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Game Mode</p>
            <div className="flex gap-2">
              {['holdem', 'omaha'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setMode(mode)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${
                    room.gameMode === mode
                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                      : 'border-white/20 bg-black/30 text-gray-400 hover:border-white/40'
                  }`}
                >
                  {mode === 'holdem' ? "♠ Texas Hold'em" : '🃏 Pot-Limit Omaha'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Players */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            Players ({room.players.length}/8)
          </p>
          <div className="flex flex-col gap-2">
            {room.players.map(p => (
              <div key={p.id}
                   className="flex items-center gap-3 rounded-xl p-3"
                   style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>

                {/* Connection dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.isConnected !== false ? 'bg-green-400' : 'bg-gray-500'}`} />

                {/* Avatar */}
                {p.avatar && <span style={{ fontSize: '1.4rem' }}>{p.avatar}</span>}

                {editingId === p.id && isHost ? (
                  <>
                    <input
                      className="input-field text-sm flex-1"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Name"
                      onKeyDown={e => e.key === 'Enter' && saveEdit(p.id)}
                    />
                    <input
                      className="input-field text-sm"
                      style={{ width: 88 }}
                      value={editChips}
                      onChange={e => setEditChips(e.target.value)}
                      placeholder="Chips"
                      type="number"
                      onKeyDown={e => e.key === 'Enter' && saveEdit(p.id)}
                    />
                    <button className="btn-action btn-check text-xs px-3 py-1.5" onClick={() => saveEdit(p.id)}>✓</button>
                    <button className="btn-action btn-secondary text-xs px-2 py-1.5" onClick={() => setEditingId(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-semibold truncate">{p.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {room.hostId === p.id && (
                        <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>HOST</span>
                      )}
                      <span className="text-xs font-mono" style={{ color: '#ffd54f' }}>
                        💰 {p.chips.toLocaleString()}
                      </span>
                      {isHost && (
                        <button
                          className="btn-action btn-secondary text-xs px-2 py-1"
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start / waiting */}
        {isHost ? (
          <button
            className="btn-action btn-primary w-full py-4 text-xl font-black"
            onClick={startGame}
            disabled={room.players.length < 2}
          >
            {room.players.length < 2 ? 'Need 2+ players' : '▶ Start Game'}
          </button>
        ) : (
          <p className="text-center text-gray-400 text-sm animate-pulse">
            Waiting for host to start the game…
          </p>
        )}
      </div>
    </div>
  );
}
