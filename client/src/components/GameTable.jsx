import PlayerSeat from './PlayerSeat';
import ActionBar from './ActionBar';
import HandResults from './HandResults';
import ChatPanel from './ChatPanel';
import { CardDisplay } from '../utils/cards.jsx';

// Positions for up to 8 seats arranged around an oval.
// Values are { top, left, transform } as CSS strings, using % of container.
// Seat 0 = current player (bottom-center), then clockwise.
const SEAT_POSITIONS = [
  { bottom: '2%',  left:  '50%', transform: 'translateX(-50%)' },  // 0 – me (bottom center)
  { bottom: '12%', right: '4%',  transform: 'none' },               // 1 – bottom right
  { top:    '50%', right: '1%',  transform: 'translateY(-50%)' },   // 2 – mid right
  { top:    '10%', right: '4%',  transform: 'none' },               // 3 – top right
  { top:     '2%', left:  '50%', transform: 'translateX(-50%)' },   // 4 – top center
  { top:    '10%', left:  '4%',  transform: 'none' },               // 5 – top left
  { top:    '50%', left:  '1%',  transform: 'translateY(-50%)' },   // 6 – mid left
  { bottom: '12%', left:  '4%',  transform: 'none' },               // 7 – bottom left
];

const PHASE_LABELS = {
  preflop: 'Pre-Flop',
  flop:    'Flop',
  turn:    'Turn',
  river:   'River',
  showdown:'Showdown',
};

export default function GameTable({ room, playerId }) {
  const showResults = room.handOver || room.status === 'hand_over';

  // Active players for dealer/blind assignment
  const activePlayers = room.players.filter(p => p.chips > 0 || p.allIn);

  // Re-order so current player is seat 0 (bottom center)
  const myIdx = activePlayers.findIndex(p => p.id === playerId);
  const ordered = myIdx >= 0
    ? [...activePlayers.slice(myIdx), ...activePlayers.slice(0, myIdx)]
    : activePlayers;

  const dealerPlayer = activePlayers[room.dealerIndex % activePlayers.length];
  const sbPlayer     = activePlayers[room.smallBlindIndex % activePlayers.length];
  const bbPlayer     = activePlayers[room.bigBlindIndex  % activePlayers.length];

  const isMyTurn = room.currentActorId === playerId;
  const currentActorName = room.players.find(p => p.id === room.currentActorId)?.name;

  return (
    <div
      className="felt-bg min-h-screen relative overflow-hidden"
      style={{ paddingBottom: isMyTurn ? '140px' : '0' }}
    >
      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 z-10"
           style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Room <span className="font-mono font-bold text-white tracking-widest">{room.code}</span>
          </span>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', border: '1px solid rgba(255,255,255,0.15)' }}>
            {room.gameMode === 'holdem' ? "Hold'em" : 'PLO'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {room.phase && (
            <span className="badge" style={{ background: 'rgba(212,175,55,0.2)', color: '#ffd54f', border: '1px solid rgba(212,175,55,0.3)' }}>
              {PHASE_LABELS[room.phase] || room.phase.toUpperCase()}
            </span>
          )}
          {currentActorName && !showResults && (
            <span className="text-xs font-semibold animate-pulse" style={{ color: '#ffd54f' }}>
              ⟳ {currentActorName}'s turn
            </span>
          )}
        </div>
      </div>

      {/* ── Player seats ── */}
      {ordered.map((player, idx) => {
        const pos = SEAT_POSITIONS[idx] || SEAT_POSITIONS[idx % SEAT_POSITIONS.length];
        return (
          <div
            key={player.id}
            className="absolute"
            style={{ zIndex: 5, ...pos }}
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
        );
      })}

      {/* ── Center oval table ── */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'none', paddingTop: '48px' }}>
        <div
          className="poker-table flex flex-col items-center justify-center gap-3"
          style={{ width: '42vw', height: '28vw', minWidth: 320, minHeight: 200, pointerEvents: 'auto' }}
        >
          {/* Pot */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Pot</div>
            <div className="pot-amount">{(room.pot || 0).toLocaleString()}</div>
          </div>

          {/* Community cards */}
          <div className="flex gap-2 flex-wrap justify-center items-center">
            {room.communityCards?.length > 0
              ? room.communityCards.map((c, i) => (
                  <CardDisplay key={i} code={c} size="lg" animate />
                ))
              : room.phase && room.phase !== 'showdown'
                ? <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.35)' }}>Waiting for flop…</p>
                : null
            }
          </div>

          {/* Current bet */}
          {room.currentBet > 0 && (
            <div className="text-xs font-mono font-bold" style={{ color: '#ffcc80' }}>
              Current bet: {room.currentBet.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* ── Action bar ── */}
      <ActionBar room={room} playerId={playerId} />

      {/* ── Chat ── */}
      <ChatPanel room={room} playerId={playerId} />

      {/* ── Hand results overlay ── */}
      {showResults && <HandResults room={room} playerId={playerId} />}
    </div>
  );
}
