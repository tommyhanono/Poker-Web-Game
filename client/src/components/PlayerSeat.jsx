import { CardDisplay } from '../utils/cards.jsx';

export default function PlayerSeat({ player, isMe, isActive, isDealer, isSB, isBB, pot }) {
  const cardCount = player.holeCardCount || player.holeCards?.length || 0;

  return (
    <div className={`player-seat ${isActive ? 'active-turn' : ''} ${player.folded ? 'folded' : ''} relative`}>
      {/* Badges row */}
      <div className="flex items-center gap-1 mb-1 flex-wrap">
        {isDealer && <span className="dealer-btn">D</span>}
        {isSB && <span className="badge badge-sb">SB</span>}
        {isBB && <span className="badge badge-bb">BB</span>}
        {player.allIn && <span className="badge" style={{ background: '#6a1b9a' }}>ALL-IN</span>}
      </div>

      {/* Name + chips */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-bold text-sm truncate max-w-24">{player.name}</span>
        {isMe && <span className="text-xs text-blue-300">(you)</span>}
        {!player.isConnected && <span className="text-xs text-gray-500">●</span>}
      </div>
      <div className="text-xs text-yellow-400 font-mono mb-1.5">{player.chips} chips</div>

      {/* Current bet */}
      {player.currentBet > 0 && (
        <div className="text-xs text-orange-300 font-mono mb-1.5">Bet: {player.currentBet}</div>
      )}

      {/* Cards */}
      <div className="flex gap-1 flex-wrap">
        {player.holeCards?.map((c, i) => (
          <CardDisplay key={i} code={c} size="sm" faceDown={!isMe && c === 'back'} />
        ))}
        {(!player.holeCards || player.holeCards.length === 0) && cardCount > 0 &&
          Array.from({ length: cardCount }).map((_, i) => (
            <CardDisplay key={i} code="back" size="sm" />
          ))
        }
      </div>

      {/* Last action */}
      {player.lastAction && (
        <div className="text-xs text-gray-400 mt-1 italic">{player.lastAction}</div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
      )}
    </div>
  );
}
