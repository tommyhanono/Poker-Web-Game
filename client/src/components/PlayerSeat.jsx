import { CardDisplay } from '../utils/cards.jsx';

const ACTION_CLASS = {
  fold:  'action-fold',
  check: 'action-check',
  call:  'action-call',
  raise: 'action-raise',
  allin: 'action-allin',
};

function actionClass(lastAction) {
  if (!lastAction) return '';
  const key = lastAction.toLowerCase().split(' ')[0]; // "raise 200" → "raise"
  return ACTION_CLASS[key] || '';
}

// compact = mobile opponent cards (smaller)
export default function PlayerSeat({ player, isMe, isActive, isDealer, isSB, isBB, compact = false }) {
  const cardCount = player.holeCardCount || player.holeCards?.length || 0;
  // xl for me on desktop, lg for me on mobile, sm/xs for opponents
  const cardSize = isMe ? 'xl' : (compact ? 'sm' : 'sm');

  return (
    <div
      className={`player-seat ${isActive ? 'active-turn' : ''} ${player.folded ? 'folded' : ''}`}
      style={compact ? { padding: '0.5rem 0.6rem', minWidth: 72 } : {}}
    >
      {/* Top row: avatar + name */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {player.avatar && (
          <span style={{ fontSize: compact ? '1rem' : isMe ? '1.5rem' : '1.2rem', lineHeight: 1, flexShrink: 0 }}>
            {player.avatar}
          </span>
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span
              className="font-bold truncate max-w-24"
              style={{ fontSize: compact ? '0.72rem' : isMe ? '1rem' : '0.88rem' }}
            >
              {player.name}
            </span>
            {isMe && !compact && <span className="text-xs text-blue-300 font-semibold">(you)</span>}
            {!player.isConnected && (
              <span style={{ fontSize: '0.65rem', color: '#9ca3af' }} title="Disconnected">⚡</span>
            )}
          </div>
          {/* Chips */}
          <span
            className="font-mono font-bold"
            style={{ fontSize: compact ? '0.68rem' : isMe ? '0.9rem' : '0.78rem', color: '#ffd54f' }}
          >
            💰 {player.chips.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Badges: Dealer / SB / BB / All-In */}
      {(isDealer || isSB || isBB || player.allIn) && (
        <div className="flex items-center gap-1 mb-1.5 flex-wrap">
          {isDealer && <span className="dealer-btn">D</span>}
          {isSB && <span className="badge badge-sb">SB</span>}
          {isBB && <span className="badge badge-bb">BB</span>}
          {player.allIn && (
            <span className="badge" style={{ background: 'rgba(106,27,154,0.4)', color: '#ce93d8', border: '1px solid rgba(106,27,154,0.5)' }}>
              ALL-IN
            </span>
          )}
        </div>
      )}

      {/* Current bet */}
      {player.currentBet > 0 && (
        <div
          className="text-xs font-mono font-bold mb-1.5"
          style={{ color: '#ffcc80' }}
        >
          Bet: {player.currentBet.toLocaleString()}
        </div>
      )}

      {/* Cards */}
      <div className="flex gap-1.5 flex-wrap mt-1">
        {player.holeCards?.map((c, i) => (
          <CardDisplay key={i} code={c} size={cardSize} faceDown={!isMe && c === 'back'} animate />
        ))}
        {(!player.holeCards || player.holeCards.length === 0) && cardCount > 0 &&
          Array.from({ length: cardCount }).map((_, i) => (
            <CardDisplay key={i} code="back" size={cardSize} />
          ))
        }
      </div>

      {/* Last action badge */}
      {player.lastAction && (
        <div className="mt-1.5">
          <span className={`action-badge ${actionClass(player.lastAction)}`}>
            {player.lastAction}
          </span>
        </div>
      )}

      {/* Active ping dot */}
      {isActive && (
        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-yellow-400 animate-ping" />
      )}
    </div>
  );
}
