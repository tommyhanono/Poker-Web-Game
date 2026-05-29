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

export default function PlayerSeat({ player, isMe, isActive, isDealer, isSB, isBB }) {
  const cardCount = player.holeCardCount || player.holeCards?.length || 0;
  // my cards are xl, opponents are sm
  const cardSize = isMe ? 'xl' : 'sm';

  return (
    <div className={`player-seat ${isActive ? 'active-turn' : ''} ${player.folded ? 'folded' : ''}`}>
      {/* Top row: avatar + name */}
      <div className="flex items-center gap-2 mb-1.5">
        {player.avatar && (
          <span style={{ fontSize: isMe ? '1.5rem' : '1.2rem', lineHeight: 1 }}>{player.avatar}</span>
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className={`font-bold truncate ${isMe ? 'text-base' : 'text-sm'} max-w-28`}>
              {player.name}
            </span>
            {isMe && <span className="text-xs text-blue-300 font-semibold">(you)</span>}
            {!player.isConnected && (
              <span className="text-xs text-gray-500" title="Disconnected">⚡</span>
            )}
          </div>
          {/* Chips */}
          <span
            className="font-mono font-bold"
            style={{ fontSize: isMe ? '0.9rem' : '0.78rem', color: '#ffd54f' }}
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
