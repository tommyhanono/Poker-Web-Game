import { useState } from 'react';
import socket from '../socket';
import { CardDisplay } from '../utils/cards.jsx';

export default function HandResults({ room, playerId }) {
  const isHost  = room.hostId === playerId;
  const results = room.handResults || [];
  const [addChipsId, setAddChipsId] = useState(null);
  const [addAmount,  setAddAmount]  = useState('');

  const nextHand = () => socket.emit('next_hand');
  const voteMode = (mode) => socket.emit('vote_game_mode', { gameMode: mode });

  const doAddChips = (pid) => {
    const amt = parseInt(addAmount);
    if (!amt || amt <= 0) return;
    socket.emit('add_chips', { playerId: pid, amount: amt });
    setAddChipsId(null);
    setAddAmount('');
  };

  const activePlayers = room.players.filter(
    p => !p.folded || results.some(r => r.winners?.includes(p.id))
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="panel p-6 w-full max-w-lg flex flex-col gap-5 max-h-[92vh] overflow-y-auto scrollbar-thin hand-results-enter">

        {/* Title */}
        <h2 className="text-3xl font-black text-center" style={{ color: 'var(--gold)', textShadow: '0 0 20px var(--gold-glow)' }}>
          🃏 Hand Complete
        </h2>

        {/* Community cards */}
        {room.communityCards?.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Board</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {room.communityCards.map((c, i) => <CardDisplay key={i} code={c} size="md" />)}
            </div>
          </div>
        )}

        {/* Winner results per pot */}
        {results.map((r, i) => {
          const winners = room.players.filter(p => r.winners?.includes(p.id));
          return (
            <div key={i} className="rounded-xl p-4 text-center"
                 style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)' }}>
              <p className="font-black text-xl" style={{ color: 'var(--gold)' }}>
                🏆 {winners.map(w => w.name).join(' & ')} wins {r.amount.toLocaleString()}!
              </p>
              {r.description && <p className="text-gray-300 text-sm mt-1">{r.description}</p>}
              {r.handDescriptions?.map(hd => {
                const p = room.players.find(pl => pl.id === hd.playerId);
                return p ? (
                  <p key={hd.playerId} className="text-xs text-gray-400 mt-0.5">{p.name}: {hd.descr}</p>
                ) : null;
              })}
            </div>
          );
        })}

        {/* Hole cards shown */}
        {activePlayers.filter(p => p.holeCards?.length && p.holeCards[0] !== 'back').length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider text-center mb-2">Hole Cards</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {activePlayers.filter(p => p.holeCards?.length && p.holeCards[0] !== 'back').map(p => (
                <div key={p.id} className="text-center">
                  <p className="text-xs text-gray-400 mb-1">{p.name}</p>
                  <div className="flex gap-1 justify-center">
                    {p.holeCards.map((c, i) => <CardDisplay key={i} code={c} size="sm" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Add Chips (host only) ── */}
        {isHost && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-sm font-bold text-gray-300 mb-3">💰 Add Chips</p>
            <div className="flex flex-col gap-2">
              {room.players.map(p => (
                <div key={p.id}>
                  {addChipsId === p.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate">{p.name}</span>
                      <input
                        type="number"
                        className="input-field text-sm text-center"
                        style={{ width: 90 }}
                        placeholder="Amount"
                        value={addAmount}
                        onChange={e => setAddAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && doAddChips(p.id)}
                        autoFocus
                        min={1}
                      />
                      <button className="btn-action btn-check text-xs px-3 py-1.5" onClick={() => doAddChips(p.id)}>✓</button>
                      <button className="btn-action btn-secondary text-xs px-2 py-1.5" onClick={() => setAddChipsId(null)}>✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate">{p.name}</span>
                      <span className="text-xs font-mono" style={{ color: '#ffd54f' }}>{p.chips.toLocaleString()}</span>
                      <div className="flex gap-1">
                        {[100, 500, 1000].map(amt => (
                          <button
                            key={amt}
                            className="chip-btn"
                            style={{ fontSize: '0.62rem', padding: '2px 6px' }}
                            onClick={() => socket.emit('add_chips', { playerId: p.id, amount: amt })}
                          >
                            +{amt}
                          </button>
                        ))}
                        <button
                          className="btn-action btn-secondary"
                          style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                          onClick={() => { setAddChipsId(p.id); setAddAmount(''); }}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vote game mode */}
        <div>
          <p className="text-xs text-gray-400 text-center mb-2 uppercase tracking-wider">Vote: switch mode next hand?</p>
          <div className="flex gap-2 justify-center">
            {['holdem', 'omaha'].map(mode => {
              const votes = Object.values(room.gameModeVotes || {}).filter(v => v === mode).length;
              const isCurrent = room.gameMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => voteMode(mode)}
                  className={`py-2 px-4 rounded-xl font-bold text-sm border transition-all ${
                    isCurrent
                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                      : 'border-white/20 bg-black/30 text-gray-400 hover:border-white/40'
                  }`}
                >
                  {mode === 'holdem' ? "Hold'em" : 'Omaha'}
                  {votes > 0 && <span className="ml-1 text-xs opacity-70">({votes})</span>}
                </button>
              );
            })}
          </div>
          {room.pendingGameMode && (
            <p className="text-center text-xs text-green-400 mt-1.5">
              ✓ Next hand switching to {room.pendingGameMode === 'holdem' ? "Hold'em" : 'Omaha'}
            </p>
          )}
        </div>

        {/* Next hand / waiting */}
        {isHost ? (
          <button
            className="btn-action btn-primary w-full py-4 text-lg font-black"
            onClick={nextHand}
          >
            Next Hand →
          </button>
        ) : (
          <p className="text-center text-gray-400 text-sm animate-pulse">Waiting for host to deal next hand…</p>
        )}
      </div>
    </div>
  );
}
