import { useState, useEffect } from 'react';
import PlayerSeat from './PlayerSeat';
import ActionBar from './ActionBar';
import HandResults from './HandResults';
import ChatPanel from './ChatPanel';
import { CardDisplay } from '../utils/cards.jsx';

// Desktop seat positions (absolute, % of container). Seat 0 = me.
const SEAT_POSITIONS_DESKTOP = [
  { bottom: '2%',  left:  '50%', transform: 'translateX(-50%)' },  // 0 – me
  { bottom: '12%', right: '4%',  transform: 'none' },
  { top:    '50%', right: '1%',  transform: 'translateY(-50%)' },
  { top:    '10%', right: '4%',  transform: 'none' },
  { top:     '2%', left:  '50%', transform: 'translateX(-50%)' },
  { top:    '10%', left:  '4%',  transform: 'none' },
  { top:    '50%', left:  '1%',  transform: 'translateY(-50%)' },
  { bottom: '12%', left:  '4%',  transform: 'none' },
];

const PHASE_LABELS = {
  preflop: 'Pre-Flop',
  flop:    'Flop',
  turn:    'Turn',
  river:   'River',
  showdown:'Showdown',
};

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function GameTable({ room, playerId }) {
  const isMobile = useIsMobile();
  const showResults = room.handOver || room.status === 'hand_over';

  const activePlayers = room.players.filter(p => p.chips > 0 || p.allIn);
  const myIdx = activePlayers.findIndex(p => p.id === playerId);
  const ordered = myIdx >= 0
    ? [...activePlayers.slice(myIdx), ...activePlayers.slice(0, myIdx)]
    : activePlayers;

  const dealerPlayer = activePlayers[room.dealerIndex % activePlayers.length];
  const sbPlayer     = activePlayers[room.smallBlindIndex % activePlayers.length];
  const bbPlayer     = activePlayers[room.bigBlindIndex  % activePlayers.length];

  const isMyTurn = room.currentActorId === playerId;
  const currentActorName = room.players.find(p => p.id === room.currentActorId)?.name;
  const me = ordered[0];

  // ── Mobile layout ──────────────────────────────────────────────
  if (isMobile) {
    const opponents = ordered.slice(1);
    // ActionBar height: ~150px with raise controls, ~90px buttons-only
    const actionBarH = isMyTurn ? 155 : 0;

    return (
      <div className="felt-bg flex flex-col min-h-screen" style={{ paddingBottom: actionBarH }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 z-10 flex-shrink-0"
             style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              <span className="font-mono font-bold text-white tracking-widest">{room.code}</span>
            </span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#ddd', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.55rem' }}>
              {room.gameMode === 'holdem' ? "Hold'em" : 'PLO'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {room.phase && (
              <span className="badge" style={{ background: 'rgba(212,175,55,0.2)', color: '#ffd54f', border: '1px solid rgba(212,175,55,0.3)', fontSize: '0.55rem' }}>
                {PHASE_LABELS[room.phase] || room.phase}
              </span>
            )}
            {currentActorName && !showResults && (
              <span className="text-xs font-semibold animate-pulse" style={{ color: '#ffd54f', fontSize: '0.7rem' }}>
                ⟳ {currentActorName}
              </span>
            )}
          </div>
        </div>

        {/* Opponents row (scrollable) */}
        <div className="flex gap-2 px-2 py-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          {opponents.map(player => (
            <div key={player.id} style={{ flexShrink: 0 }}>
              <PlayerSeat
                player={player}
                isMe={false}
                isActive={room.currentActorId === player.id}
                isDealer={dealerPlayer?.id === player.id}
                isSB={sbPlayer?.id === player.id}
                isBB={bbPlayer?.id === player.id}
                compact
              />
            </div>
          ))}
        </div>

        {/* Center: table + community cards */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-2">
          <div
            className="poker-table flex flex-col items-center justify-center gap-2 w-full"
            style={{ borderRadius: '40px', padding: '1rem 1.2rem', maxWidth: 360 }}
          >
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-widest" style={{ fontSize: '0.6rem' }}>Pot</div>
              <div className="pot-amount" style={{ fontSize: '1.5rem' }}>{(room.pot || 0).toLocaleString()}</div>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {room.communityCards?.length > 0
                ? room.communityCards.map((c, i) => <CardDisplay key={i} code={c} size="md" animate />)
                : room.phase && room.phase !== 'showdown'
                  ? <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.35)' }}>Waiting for flop…</p>
                  : null
              }
            </div>
            {room.currentBet > 0 && (
              <div className="text-xs font-mono font-bold" style={{ color: '#ffcc80', fontSize: '0.7rem' }}>
                Bet: {room.currentBet.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* My seat — always visible above ActionBar */}
        {me && (
          <div className="flex justify-center px-3 pb-3 flex-shrink-0">
            <PlayerSeat
              player={me}
              isMe
              isActive={room.currentActorId === me.id}
              isDealer={dealerPlayer?.id === me.id}
              isSB={sbPlayer?.id === me.id}
              isBB={bbPlayer?.id === me.id}
            />
          </div>
        )}

        <ActionBar room={room} playerId={playerId} />
        <ChatPanel room={room} playerId={playerId} />
        {showResults && <HandResults room={room} playerId={playerId} />}
      </div>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────
  // Seat 0 floats above ActionBar when it's my turn
  const seat0Style = {
    ...SEAT_POSITIONS_DESKTOP[0],
    bottom: isMyTurn ? '185px' : '2%',
    transition: 'bottom 0.25s ease',
  };

  return (
    <div className="felt-bg min-h-screen relative overflow-hidden">
      {/* Top bar */}
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

      {/* Player seats */}
      {ordered.map((player, idx) => {
        const pos = idx === 0 ? seat0Style : (SEAT_POSITIONS_DESKTOP[idx] || SEAT_POSITIONS_DESKTOP[idx % SEAT_POSITIONS_DESKTOP.length]);
        return (
          <div key={player.id} className="absolute" style={{ zIndex: 5, ...pos }}>
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

      {/* Oval table */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'none', paddingTop: '48px' }}>
        <div
          className="poker-table flex flex-col items-center justify-center gap-3"
          style={{ width: '42vw', height: '28vw', minWidth: 320, minHeight: 210, pointerEvents: 'auto' }}
        >
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Pot</div>
            <div className="pot-amount">{(room.pot || 0).toLocaleString()}</div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center items-center">
            {room.communityCards?.length > 0
              ? room.communityCards.map((c, i) => <CardDisplay key={i} code={c} size="lg" animate />)
              : room.phase && room.phase !== 'showdown'
                ? <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.35)' }}>Waiting for flop…</p>
                : null
            }
          </div>
          {room.currentBet > 0 && (
            <div className="text-xs font-mono font-bold" style={{ color: '#ffcc80' }}>
              Current bet: {room.currentBet.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <ActionBar room={room} playerId={playerId} />
      <ChatPanel room={room} playerId={playerId} />
      {showResults && <HandResults room={room} playerId={playerId} />}
    </div>
  );
}
