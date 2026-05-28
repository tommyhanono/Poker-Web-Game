import PlayerSeat from './PlayerSeat';
import ActionBar from './ActionBar';
import HandResults from './HandResults';
import ChatPanel from './ChatPanel';
import { CardDisplay } from '../utils/cards.jsx';

const SEAT_POSITIONS = [
  // bottom-center (me), then clockwise
  'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-4 right-4',
  'top-1/2 right-4 -translate-y-1/2',
  'top-4 right-4',
  'top-4 left-1/2 -translate-x-1/2',
  'top-4 left-4',
  'top-1/2 left-4 -translate-y-1/2',
  'bottom-4 left-4',
];

export default function GameTable({ room, playerId }) {
  const showResults = room.handOver || room.status === 'hand_over';
  const activePlayers = room.players.filter(p => p.chips > 0 || p.allIn || p.holeCards?.length);

  // Re-order so current player is "seat 0" (bottom center)
  const myIdx = activePlayers.findIndex(p => p.id === playerId);
  const ordered = myIdx >= 0
    ? [...activePlayers.slice(myIdx), ...activePlayers.slice(0, myIdx)]
    : activePlayers;

  const origActivePlayers = room.players.filter(p => p.chips > 0 || p.allIn);
  const dealerPlayer = origActivePlayers[room.dealerIndex % origActivePlayers.length];
  const sbPlayer = origActivePlayers[room.smallBlindIndex % origActivePlayers.length];
  const bbPlayer = origActivePlayers[room.bigBlindIndex % origActivePlayers.length];

  const isMyTurn = room.currentActorId === playerId;

  return (
    <div className="felt-bg min-h-screen relative overflow-hidden" style={{ paddingBottom: isMyTurn ? '120px' : '0' }}>
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-black/40 z-10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-400">Room: <span className="text-white font-bold">{room.code}</span></span>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.65rem' }}>
            {room.gameMode === 'holdem' ? "Hold'em" : 'Omaha'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {room.phase && (
            <span className="badge text-yellow-300" style={{ background: 'rgba(212,175,55,0.2)', fontSize: '0.65rem' }}>
              {room.phase.toUpperCase()}
            </span>
          )}
          {room.currentActorId && (
            <span className="text-xs text-gray-300">
              {room.players.find(p => p.id === room.currentActorId)?.name}'s turn
            </span>
          )}
        </div>
      </div>

      {/* Player seats */}
      {ordered.map((player, idx) => (
        <div
          key={player.id}
          className={`absolute ${SEAT_POSITIONS[idx] || SEAT_POSITIONS[idx % SEAT_POSITIONS.length]}`}
          style={{ zIndex: 5 }}
        >
          <PlayerSeat
            player={player}
            isMe={player.id === playerId}
            isActive={room.currentActorId === player.id}
            isDealer={dealerPlayer?.id === player.id}
            isSB={sbPlayer?.id === player.id}
            isBB={bbPlayer?.id === player.id}
          />
        </div>
      ))}

      {/* Center table area */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ pointerEvents: 'none' }}>
        {/* Oval table visual */}
        <div
          className="community-area flex flex-col items-center gap-2"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '3px solid rgba(255,255,255,0.08)',
            borderRadius: '120px',
            padding: '2rem 3rem',
            pointerEvents: 'auto',
          }}
        >
          {/* Pot */}
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Pot</p>
            <p className="text-2xl font-black" style={{ color: 'var(--gold)' }}>{room.pot || 0}</p>
          </div>

          {/* Community cards */}
          <div className="flex gap-2 flex-wrap justify-center">
            {room.communityCards?.length > 0
              ? room.communityCards.map((c, i) => <CardDisplay key={i} code={c} size="lg" />)
              : room.phase && room.phase !== 'showdown'
                ? <p className="text-gray-500 text-sm italic">Waiting for flop...</p>
                : null
            }
          </div>

          {/* Current bet info */}
          {room.currentBet > 0 && (
            <p className="text-xs text-gray-400">Current bet: <span className="text-orange-300 font-bold">{room.currentBet}</span></p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <ActionBar room={room} playerId={playerId} />

      {/* Chat */}
      <ChatPanel room={room} playerId={playerId} />

      {/* Hand results overlay */}
      {showResults && <HandResults room={room} playerId={playerId} />}
    </div>
  );
}
