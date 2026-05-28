import { useState } from 'react';
import socket from '../socket';

export default function WaitingRoom({ room, playerId }) {
  const isHost = room.hostId === playerId;
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editChips, setEditChips] = useState('');
  const [gameModeVote, setGameModeVote] = useState(room.gameMode);

  const startGame = () => socket.emit('start_game');

  const saveEdit = (pid) => {
    socket.emit('update_player', { playerId: pid, name: editName || undefined, chips: editChips ? parseInt(editChips) : undefined });
    setEditingId(null);
  };

  const setMode = (mode) => {
    setGameModeVote(mode);
    socket.emit('set_game_mode', { gameMode: mode });
  };

  return (
    <div className="felt-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="panel p-6 w-full max-w-lg">
        <div className="text-center mb-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Room Code</p>
          <p className="text-4xl font-black font-mono tracking-widest" style={{ color: 'var(--gold)' }}>{room.code}</p>
          <p className="text-gray-500 text-xs mt-1">Share this code to invite players</p>
        </div>

        {isHost && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Game Mode</p>
            <div className="flex gap-2">
              {['holdem', 'omaha'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setMode(mode)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${
                    room.gameMode === mode
                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                      : 'border-white/20 bg-black/30 text-gray-400 hover:border-white/40'
                  }`}
                >
                  {mode === 'holdem' ? "Texas Hold'em" : 'Pot-Limit Omaha'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Players ({room.players.length}/8)</p>
          <div className="flex flex-col gap-2">
            {room.players.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-black/30 rounded-lg p-2.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.isConnected !== false ? 'bg-green-400' : 'bg-gray-500'}`} />
                {editingId === p.id && isHost ? (
                  <>
                    <input className="input-field text-sm flex-1" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" />
                    <input className="input-field text-sm w-20" value={editChips} onChange={e => setEditChips(e.target.value)} placeholder="Chips" type="number" />
                    <button className="btn-action btn-check text-xs px-2 py-1" onClick={() => saveEdit(p.id)}>✓</button>
                    <button className="btn-action btn-secondary text-xs px-2 py-1" onClick={() => setEditingId(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    {room.hostId === p.id && <span className="text-xs text-yellow-400">HOST</span>}
                    <span className="text-xs text-gray-400">{p.chips} chips</span>
                    {isHost && p.id !== playerId && (
                      <button
                        className="btn-action btn-secondary text-xs px-2 py-1"
                        onClick={() => { setEditingId(p.id); setEditName(p.name); setEditChips(String(p.chips)); }}
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <button
            className="btn-action btn-primary w-full py-3 text-lg"
            onClick={startGame}
            disabled={room.players.length < 2}
          >
            {room.players.length < 2 ? 'Need 2+ players' : 'Start Game'}
          </button>
        )}
        {!isHost && (
          <p className="text-center text-gray-400 text-sm">Waiting for host to start the game...</p>
        )}
      </div>
    </div>
  );
}
