import { useState, useEffect } from 'react';
import socket from '../socket';

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function ActionBar({ room, playerId }) {
  const [raiseAmount, setRaiseAmount] = useState('');
  const [showRaise, setShowRaise] = useState(false);
  const isMobile = useIsMobile();

  const activePlayers = room.players.filter(p => p.chips > 0 || p.allIn);
  const me = activePlayers.find(p => p.id === playerId) || room.players.find(p => p.id === playerId);
  const isMyTurn = room.currentActorId === playerId;

  if (!isMyTurn || !me || me.folded || me.allIn) return null;

  const toCall     = Math.max(0, (room.currentBet || 0) - (me.currentBet || 0));
  const canCheck   = toCall === 0;
  const minRaise   = room.minRaise || 20;
  const callAmount = Math.min(toCall, me.chips);
  const raiseVal   = parseInt(raiseAmount) || minRaise;
  const canAffordRaise = me.chips > toCall + minRaise;
  const pot = room.pot || 0;

  const presets = [
    { label: '½P', value: Math.max(minRaise, Math.round(pot / 2)) },
    { label: 'Pot', value: Math.max(minRaise, pot) },
    { label: '2×P', value: Math.max(minRaise, pot * 2) },
  ].map(p => ({ ...p, value: Math.min(p.value, me.chips) }));

  const act = (action, amount) => {
    socket.emit('player_action', { action, amount: amount ? parseInt(amount) : undefined });
    setRaiseAmount('');
    setShowRaise(false);
  };

  const btnStyle = isMobile
    ? { fontSize: '0.85rem', padding: '0.65rem 0.5rem', minWidth: 0 }
    : { fontSize: '1rem', padding: '0.7rem 1rem', minWidth: 90 };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20"
      style={{
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col" style={{ padding: isMobile ? '8px 10px' : '12px 16px', gap: 8 }}>

        {/* Raise controls — desktop always visible, mobile toggled */}
        {canAffordRaise && (!isMobile || showRaise) && (
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
            {/* Slider + input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">Raise:</span>
              <input
                type="range"
                min={minRaise}
                max={me.chips}
                step={Math.max(1, Math.round(minRaise / 2))}
                value={raiseVal}
                onChange={e => setRaiseAmount(e.target.value)}
                className="flex-1 accent-yellow-400"
                style={{ height: 6 }}
              />
              <input
                type="number"
                className="input-field text-sm text-center"
                style={{ width: isMobile ? 76 : 88 }}
                value={raiseAmount || minRaise}
                onChange={e => setRaiseAmount(e.target.value)}
                min={minRaise}
                max={me.chips}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-1.5">
          <button className="btn-action btn-fold flex-1" style={btnStyle} onClick={() => act('fold')}>
            {isMobile ? '✗ Fold' : '✗ Fold'}
          </button>

          {canCheck ? (
            <button className="btn-action btn-check flex-1" style={btnStyle} onClick={() => act('check')}>
              ✓ Check
            </button>
          ) : (
            <button className="btn-action btn-call flex-1" style={btnStyle} onClick={() => act('call')}>
              {isMobile ? `Call ${callAmount}` : `Call ${callAmount.toLocaleString()}`}
            </button>
          )}

          {canAffordRaise && (
            isMobile ? (
              // Mobile: toggle raise panel, or raise with current raiseVal
              showRaise ? (
                <button
                  className="btn-action btn-raise flex-1"
                  style={btnStyle}
                  onClick={() => act('raise', raiseAmount || minRaise)}
                >
                  ↑ {raiseVal}
                </button>
              ) : (
                <button
                  className="btn-action btn-raise flex-1"
                  style={btnStyle}
                  onClick={() => setShowRaise(true)}
                >
                  ↑ Raise
                </button>
              )
            ) : (
              <button
                className="btn-action btn-raise flex-1"
                style={btnStyle}
                onClick={() => act('raise', raiseAmount || minRaise)}
              >
                ↑ Raise {raiseVal.toLocaleString()}
              </button>
            )
          )}

          <button className="btn-action btn-allin flex-1" style={btnStyle} onClick={() => act('allin')}>
            {isMobile ? `⚡ ${me.chips}` : `⚡ All-In (${me.chips.toLocaleString()})`}
          </button>
        </div>
      </div>
    </div>
  );
}
