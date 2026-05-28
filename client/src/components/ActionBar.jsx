import { useState } from 'react';
import socket from '../socket';

export default function ActionBar({ room, playerId }) {
  const [raiseAmount, setRaiseAmount] = useState('');

  const activePlayers = room.players.filter(p => p.chips > 0 || p.allIn);
  const me = activePlayers.find(p => p.id === playerId) || room.players.find(p => p.id === playerId);
  const isMyTurn = room.currentActorId === playerId;

  if (!isMyTurn || !me || me.folded || me.allIn) return null;

  const toCall = Math.max(0, (room.currentBet || 0) - (me.currentBet || 0));
  const canCheck = toCall === 0;
  const minRaise = room.minRaise || 20;

  const act = (action, amount) => {
    socket.emit('player_action', { action, amount: amount ? parseInt(amount) : undefined });
    setRaiseAmount('');
  };

  const callAmount = Math.min(toCall, me.chips);
  const raiseVal = parseInt(raiseAmount) || minRaise;
  const canAffordRaise = me.chips > toCall + minRaise;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur border-t border-white/10 z-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-3">
          {/* Raise input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">Raise by:</span>
            <input
              type="range"
              min={minRaise}
              max={me.chips}
              step={minRaise}
              value={raiseVal}
              onChange={e => setRaiseAmount(e.target.value)}
              className="flex-1 accent-yellow-400"
              disabled={!canAffordRaise}
            />
            <input
              type="number"
              className="input-field w-20 text-sm text-center"
              value={raiseAmount || minRaise}
              onChange={e => setRaiseAmount(e.target.value)}
              min={minRaise}
              max={me.chips}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap justify-center">
            <button className="btn-action btn-fold" onClick={() => act('fold')}>Fold</button>
            {canCheck
              ? <button className="btn-action btn-check" onClick={() => act('check')}>Check</button>
              : <button className="btn-action btn-call" onClick={() => act('call')}>Call {callAmount}</button>
            }
            {canAffordRaise && (
              <button className="btn-action btn-raise" onClick={() => act('raise', raiseAmount || minRaise)}>
                Raise {raiseVal}
              </button>
            )}
            <button className="btn-action btn-allin" onClick={() => act('allin')}>
              All-In ({me.chips})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
