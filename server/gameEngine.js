const { Hand } = require('pokersolver');
const { SUITS, RANKS, SMALL_BLIND, BIG_BLIND } = require('./config');

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function dealHand(room) {
  const deck = shuffleDeck(createDeck());
  const holeCount = room.gameMode === 'omaha' ? 4 : 2;
  const activePlayers = room.players.filter(p => p.chips > 0);

  activePlayers.forEach(p => {
    p.holeCards = [];
    p.folded = false;
    p.allIn = false;
    p.currentBet = 0;
    p.lastAction = null;
  });

  // Deal hole cards
  let idx = 0;
  for (let i = 0; i < holeCount; i++) {
    for (const p of activePlayers) {
      p.holeCards.push(deck[idx++]);
    }
  }

  room.deck = deck;
  room.deckIndex = idx;
  room.communityCards = [];
  room.pot = 0;
  room.sidePots = [];
  room.phase = 'preflop';
  room.lastRaiseAmount = BIG_BLIND;
  room.handOver = false;

  // Rotate dealer
  if (room.dealerIndex === undefined) {
    room.dealerIndex = 0;
  } else {
    room.dealerIndex = nextActiveIndex(activePlayers, room.dealerIndex, activePlayers);
  }

  // Post blinds
  const sbIdx = nextActiveIndex(activePlayers, room.dealerIndex, activePlayers);
  const bbIdx = nextActiveIndex(activePlayers, sbIdx, activePlayers);

  const sbPlayer = activePlayers[sbIdx];
  const bbPlayer = activePlayers[bbIdx];

  const sb = Math.min(SMALL_BLIND, sbPlayer.chips);
  const bb = Math.min(BIG_BLIND, bbPlayer.chips);

  sbPlayer.chips -= sb;
  sbPlayer.currentBet = sb;
  if (sbPlayer.chips === 0) sbPlayer.allIn = true;

  bbPlayer.chips -= bb;
  bbPlayer.currentBet = bb;
  if (bbPlayer.chips === 0) bbPlayer.allIn = true;

  room.pot = sb + bb;
  room.currentBet = bb;
  room.minRaise = bb;

  // Action starts left of BB
  room.smallBlindIndex = sbIdx;
  room.bigBlindIndex = bbIdx;
  room.activePlayerIndices = activePlayers.map((_, i) => i);
  room.currentActorIndex = nextActiveIndex(activePlayers, bbIdx, activePlayers);
  room.actionStartIndex = room.currentActorIndex;

  room.bettingRoundStartIndex = room.currentActorIndex;
  room.actionsThisRound = 0;
}

function nextActiveIndex(players, fromIndex, allPlayers) {
  const arr = allPlayers || players;
  let i = (fromIndex + 1) % arr.length;
  while (i !== fromIndex) {
    if (!arr[i].folded && !arr[i].allIn) return i;
    i = (i + 1) % arr.length;
  }
  return fromIndex;
}

function getActivePlayers(room) {
  return room.players.filter(p => p.chips > 0 || p.allIn);
}

function getActingPlayers(room) {
  return getActivePlayers(room).filter(p => !p.folded && !p.allIn);
}

function advancePhase(room) {
  const phases = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentPhaseIdx = phases.indexOf(room.phase);
  room.phase = phases[currentPhaseIdx + 1];

  if (room.phase === 'showdown') {
    return resolveShowdown(room);
  }

  // Deal community cards
  const cardCounts = { flop: 3, turn: 1, river: 1 };
  const count = cardCounts[room.phase];
  for (let i = 0; i < count; i++) {
    room.communityCards.push(room.deck[room.deckIndex++]);
  }

  // Reset bets for new round
  const activePlayers = getActivePlayers(room);
  activePlayers.forEach(p => { p.currentBet = 0; });
  room.currentBet = 0;
  room.minRaise = BIG_BLIND;
  room.lastRaiseAmount = BIG_BLIND;

  // Action starts left of dealer
  const acting = activePlayers.filter(p => !p.folded && !p.allIn);
  if (acting.length === 0) {
    // All remaining players are all-in, keep advancing
    return advancePhase(room);
  }

  const dealerPlayerIdx = room.dealerIndex % activePlayers.length;
  let startIdx = (dealerPlayerIdx + 1) % activePlayers.length;
  while (activePlayers[startIdx].folded || activePlayers[startIdx].allIn) {
    startIdx = (startIdx + 1) % activePlayers.length;
  }
  room.currentActorIndex = startIdx;
  room.bettingRoundStartIndex = startIdx;
  room.actionsThisRound = 0;

  return null;
}

function calculateSidePots(players) {
  const eligible = players.filter(p => !p.folded);
  const contributions = players
    .filter(p => p.totalContributed > 0)
    .map(p => ({ id: p.id, amount: p.totalContributed, folded: p.folded }));

  contributions.sort((a, b) => a.amount - b.amount);

  const pots = [];
  let processed = 0;

  for (let i = 0; i < contributions.length; i++) {
    if (contributions[i].amount <= processed) continue;
    const level = contributions[i].amount - processed;
    let potAmount = 0;
    const eligibleIds = [];

    for (const c of contributions) {
      const contrib = Math.min(c.amount - processed, level);
      if (contrib > 0) {
        potAmount += contrib;
        if (!c.folded) eligibleIds.push(c.id);
      }
    }

    pots.push({ amount: potAmount, eligibleIds });
    processed += level;
  }

  return pots;
}

function evaluateHoldem(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  return Hand.solve(allCards);
}

function evaluateOmaha(holeCards, communityCards) {
  let bestHand = null;
  // Must use exactly 2 hole cards and 3 community cards
  const holeCombos = combinations(holeCards, 2);
  const commCombos = combinations(communityCards, 3);

  for (const hc of holeCombos) {
    for (const cc of commCombos) {
      const hand = Hand.solve([...hc, ...cc]);
      if (!bestHand || Hand.winners([bestHand, hand])[0] === hand) {
        bestHand = hand;
      }
    }
  }
  return bestHand;
}

function combinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function resolveShowdown(room) {
  const activePlayers = getActivePlayers(room);
  const nonFolded = activePlayers.filter(p => !p.folded);

  if (nonFolded.length === 1) {
    nonFolded[0].chips += room.pot;
    room.handOver = true;
    return [{ winners: [nonFolded[0].id], amount: room.pot, description: 'Last player standing' }];
  }

  // Calculate total contributions for side pots
  activePlayers.forEach(p => {
    if (!p.totalContributed) p.totalContributed = 0;
  });

  const sidePots = room.sidePots && room.sidePots.length > 0
    ? room.sidePots
    : [{ amount: room.pot, eligibleIds: nonFolded.map(p => p.id) }];

  const results = [];

  for (const pot of sidePots) {
    const eligible = nonFolded.filter(p => pot.eligibleIds.includes(p.id));
    if (eligible.length === 0) {
      // Give to closest eligible
      nonFolded[0].chips += pot.amount;
      continue;
    }

    const hands = eligible.map(p => {
      const hand = room.gameMode === 'omaha'
        ? evaluateOmaha(p.holeCards, room.communityCards)
        : evaluateHoldem(p.holeCards, room.communityCards);
      return { player: p, hand };
    });

    const winningHands = Hand.winners(hands.map(h => h.hand));
    const winners = hands.filter(h => winningHands.includes(h.hand)).map(h => h.player);
    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount - share * winners.length;

    winners.forEach((w, i) => {
      w.chips += share + (i === 0 ? remainder : 0);
    });

    results.push({
      winners: winners.map(w => w.id),
      amount: pot.amount,
      description: hands[0]?.hand?.descr || 'Best hand',
      handDescriptions: hands.map(h => ({ playerId: h.player.id, descr: h.hand?.descr }))
    });
  }

  room.handOver = true;
  return results;
}

function processAction(room, playerId, action, amount) {
  const activePlayers = getActivePlayers(room);
  const actorIdx = room.currentActorIndex;
  const actor = activePlayers[actorIdx];

  if (!actor || actor.id !== playerId) {
    return { error: 'Not your turn' };
  }

  switch (action) {
    case 'fold':
      actor.folded = true;
      actor.lastAction = 'fold';
      break;

    case 'check':
      if (room.currentBet > actor.currentBet) {
        return { error: 'Cannot check, must call or raise' };
      }
      actor.lastAction = 'check';
      break;

    case 'call': {
      const toCall = room.currentBet - actor.currentBet;
      const actual = Math.min(toCall, actor.chips);
      actor.chips -= actual;
      actor.currentBet += actual;
      room.pot += actual;
      if (actor.chips === 0) actor.allIn = true;
      actor.lastAction = 'call';
      break;
    }

    case 'raise': {
      const toCall = room.currentBet - actor.currentBet;
      const raiseBy = amount;
      if (raiseBy < room.minRaise && actor.chips > toCall + raiseBy) {
        return { error: `Minimum raise is ${room.minRaise}` };
      }
      const total = toCall + raiseBy;
      const actual = Math.min(total, actor.chips);
      actor.chips -= actual;
      actor.currentBet += actual;
      room.pot += actual;
      room.lastRaiseAmount = raiseBy;
      room.minRaise = raiseBy;
      room.currentBet = actor.currentBet;
      if (actor.chips === 0) actor.allIn = true;
      actor.lastAction = `raise ${actual}`;
      // Reset action loop — everyone else needs to act again
      room.bettingRoundStartIndex = nextActivePlayerIdx(activePlayers, actorIdx);
      break;
    }

    case 'allin': {
      const allInAmount = actor.chips;
      actor.currentBet += allInAmount;
      room.pot += allInAmount;
      actor.chips = 0;
      actor.allIn = true;
      if (actor.currentBet > room.currentBet) {
        room.lastRaiseAmount = actor.currentBet - room.currentBet;
        room.minRaise = room.lastRaiseAmount;
        room.currentBet = actor.currentBet;
        room.bettingRoundStartIndex = nextActivePlayerIdx(activePlayers, actorIdx);
      }
      actor.lastAction = 'all-in';
      break;
    }

    default:
      return { error: 'Unknown action' };
  }

  // Advance to next player
  const nextIdx = nextActivePlayerIdx(activePlayers, actorIdx);
  room.currentActorIndex = nextIdx;
  room.actionsThisRound++;

  // Check if betting round is over
  const actingPlayers = activePlayers.filter(p => !p.folded && !p.allIn);
  const nonFolded = activePlayers.filter(p => !p.folded);

  if (nonFolded.length === 1) {
    // Everyone else folded
    return { phaseResult: resolveShowdown(room) };
  }

  // Check if all acting players have matched the current bet or folded/all-in
  const allActed = actingPlayers.every(p => p.currentBet === room.currentBet);
  const roundComplete = actingPlayers.length === 0 || (allActed && room.actionsThisRound >= actingPlayers.length);

  if (roundComplete || (actingPlayers.length > 0 && nextIdx === room.bettingRoundStartIndex && allActed)) {
    const phaseResult = advancePhase(room);
    return { phaseResult };
  }

  return {};
}

function nextActivePlayerIdx(players, fromIdx) {
  let i = (fromIdx + 1) % players.length;
  const start = i;
  while (players[i].folded || players[i].allIn) {
    i = (i + 1) % players.length;
    if (i === start) return fromIdx;
  }
  return i;
}

module.exports = {
  dealHand,
  processAction,
  getActivePlayers,
  getActingPlayers,
  evaluateHoldem,
  evaluateOmaha,
  resolveShowdown,
};
