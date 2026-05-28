import socket from '../socket';
import { CardDisplay } from '../utils/cards.jsx';

export default function HandResults({ room, playerId }) {
  const isHost = room.hostId === playerId;
  const results = room.handResults || [];

  const nextHand = () => socket.emit('next_hand');
  const voteMode = (mode) => socket.emit('vote_game_mode', { gameMode: mode });

  const activePlayers = room.players.filter(p => !p.folded || results.some(r => r.winners?.includes(p.id)));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="panel p-6 w-full max-w-lg flex flex-col gap-4 max-h-screen overflow-y-auto scrollbar-thin">
        <h2 className="text-2xl font-black text-center" style={{ color: 'var(--gold)' }}>
          Hand Complete
        </h2>

        {/* Community cards */}
        {room.communityCards?.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Community Cards</p>
            <div className="flex gap-1.5 justify-center flex-wrap">
              {room.communityCards.map((c, i) => <CardDisplay key={i} code={c} size="md" />)}
            </div>
          </div>
        )}

        {/* Results per pot */}
        {results.map((r, i) => {
          const winners = room.players.filter(p => r.winners?.includes(p.id));
          return (
            <div key={i} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-lg">
                {winners.map(w => w.name).join(' & ')} wins {r.amount} chips!
              </p>
              {r.description && <p className="text-gray-300 text-sm mt-0.5">{r.description}</p>}
              {r.handDescriptions?.map(hd => {
                const p = room.players.find(pl => pl.id === hd.playerId);
                return p ? (
                  <p key={hd.playerId} className="text-xs text-gray-400">{p.name}: {hd.descr}</p>
                ) : null;
              })}
            </div>
          );
        })}

        {/* Player hole cards shown at showdown */}
        <div className="flex flex-wrap gap-2 justify-center">
          {activePlayers.filter(p => p.holeCards?.length && p.holeCards[0] !== 'back').map(p => (
            <div key={p.id} className="text-center">
              <p className="text-xs text-gray-400 mb-1">{p.name}</p>
              <div className="flex gap-1">
                {p.holeCards.map((c, i) => <CardDisplay key={i} code={c} size="sm" />)}
              </div>
            </div>
          ))}
        </div>

        {/* Vote mode */}
        <div>
          <p className="text-xs text-gray-400 text-center mb-2">Vote to switch game mode for next hand</p>
          <div className="flex gap-2 justify-center">
            {['holdem', 'omaha'].map(mode => {
              const votes = Object.values(room.gameModeVotes || {}).filter(v => v === mode).length;
              const isCurrentMode = room.gameMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => voteMode(mode)}
                  className={`py-1.5 px-3 rounded-lg font-bold text-sm border transition-all ${
                    isCurrentMode
                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                      : 'border-white/20 bg-black/30 text-gray-400 hover:border-white/40'
                  }`}
                >
                  {mode === 'holdem' ? "Hold'em" : 'Omaha'}
                  {votes > 0 && <span className="ml-1 text-xs">({votes})</span>}
                </button>
              );
            })}
          </div>
          {room.pendingGameMode && (
            <p className="text-center text-xs text-green-400 mt-1">
              Next hand: switching to {room.pendingGameMode === 'holdem' ? "Hold'em" : 'Omaha'}
            </p>
          )}
        </div>

        {isHost ? (
          <button className="btn-action btn-primary w-full py-3 text-lg" onClick={nextHand}>
            Next Hand →
          </button>
        ) : (
          <p className="text-center text-gray-400 text-sm">Waiting for host to deal next hand...</p>
        )}
      </div>
    </div>
  );
}
