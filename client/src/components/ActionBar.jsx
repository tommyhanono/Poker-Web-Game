import { useState } from 'react';
import socket from '../socket';

export default function ActionBar({ room, playerId }) {
  const [raiseAmount, setRaiseAmount] = useState('');

  const activePlayers = room.players.filter(p => p.chips > 0 || p.allIn);
  const me = activePlayers.find(p => p.id === playerId) || room.players.find(p => p.id === playerId);
  const isMyTurn = room.currentActorId === playerId;

  if (!isMyTurn || !me || me.folded || me.allIn) return null;

  const toCall    = Math.max(0, (room.currentBet || 0) - (me.currentBet || 0));
  const canCheck  = toCall === 0;
  const minRaise  = room.minRaise || 20;
  const callAmount = Math.min(toCall, me.chips);
  const raiseVal   = parseInt(raiseAmount) || minRaise;
  const canAffordRaise = me.chips > toCall + minRaise;

  const pot = room.pot || 0;

  // Quick-bet presets: ½ pot, pot, 2× pot (clamped to my chips, must be ≥ minRaise)
  const presets = [
    { label: '½ Pot', value: Math.max(minRaise, Math.round(pot / 2)) },
    { label: 'Pot',   value: Math.max(minRaise, pot) },
    { label: '2× Pot',value: Math.max(minRaise, pot * 2) },
  ].map(p => ({ ...p, value: Math.min(p.value, me.chips) }));

  const act = (action, amount) => {
    socket.emit('player_action', { action, amount: amount ? parseInt(amount) : undefined });
    setRaiseAmount('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20"
         style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="max-w-2xl mx-auto px-4 py-3 flex flex-col gap-3">

        {/* Raise row */}
        {canAffordRaise && (
          <div className="flex flex-col gap-2">
            {/* Quick-bet chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 whitespace-nowrap">Quick:</span>
              {presets.map(p => (
                <button
                  key={p.label}
                  className="chip-btn"
                  onClick={() => setRaiseAmount(String(p.value))}
                >
                  {p.label} ({p.value.toLocaleString()})
                </button>
              ))}
            </div>

            {/* Slider + number input */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 whitespace-nowrap">Raise:</span>
              <input
                type="range"
                min={minRaise}
                max={me.chips}
                step={Math.max(1, Math.round(minRaise / 2))}
                value={raiseVal}
                onChange={e => setRaiseAmount(e.target.value)}
                className="flex-1 accent-yellow-400 h-1.5"
              />
              <input
                type="number"
                className="input-field text-sm text-center"
                style={{ width: 88 }}
                value={raiseAmount || minRaise}
                onChange={e => setRaiseAmount(e.target.value)}
                min={minRaise}
                max={me.chips}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            className="btn-action btn-fold flex-1"
            style={{ minWidth: 90, fontSize: '1rem', padding: '0.7rem 1rem' }}
            onClick={() => act('fold')}
          >
            ✗ Fold
          </button>

          {canCheck ? (
            <button
              className="btn-action btn-check flex-1"
              style={{ minWidth: 90, fontSize: '1rem', padding: '0.7rem 1rem' }}
              onClick={() => act('check')}
            >
              ✓ Check
            </button>
          ) : (
            <button
              className="btn-action btn-call flex-1"
              style={{ minWidth: 90, fontSize: '1rem', padding: '0.7rem 1rem' }}
              onClick={() => act('call')}
            >
              Call {callAmount.toLocaleString()}
            </button>
          )}

          {canAffordRaise && (
            <button
              className="btn-action btn-raise flex-1"
              style={{ minWidth: 90, fontSize: '1rem', padding: '0.7rem 1rem' }}
              onClick={() => act('raise', raiseAmount || minRaise)}
            >
              ↑ Raise {raiseVal.toLocaleString()}
            </button>
          )}

          <button
            className="btn-action btn-allin flex-1"
            style={{ minWidth: 90, fontSize: '1rem', padding: '0.7rem 1rem' }}
            onClick={() => act('allin')}
          >
            ⚡ All-In ({me.chips.toLocaleString()})
          </button>
        </div>
      </div>
    </div>
  );
}
