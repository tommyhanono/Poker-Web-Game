const { v4: uuidv4 } = require('uuid');
const { dealHand, processAction, getActivePlayers } = require('./gameEngine');
const { ADMIN_PASSWORD, ADMIN_TOKEN_PREFIX } = require('./config');
const crypto = require('crypto');

const rooms = new Map();
const adminSessions = new Set();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function sanitizeRoomForPlayer(room, playerId, isAdmin) {
  const activePlayers = room.players.filter(p => p.chips > 0 || p.allIn);
  const currentActor = activePlayers[room.currentActorIndex];

  const players = room.players.map(p => {
    const isMe = p.id === playerId;
    return {
      id: p.id,
      name: p.name,
      chips: p.chips,
      currentBet: p.currentBet,
      folded: p.folded,
      allIn: p.allIn,
      lastAction: p.lastAction,
      isConnected: p.isConnected,
      avatar: p.avatar || null,
      holeCards: isMe || isAdmin ? p.holeCards : p.holeCards?.map(() => 'back'),
      holeCardCount: p.holeCards?.length || 0,
    };
  });

  return {
    code: room.code,
    hostId: room.hostId,
    gameMode: room.gameMode,
    phase: room.phase,
    communityCards: room.communityCards,
    pot: room.pot,
    currentBet: room.currentBet,
    minRaise: room.minRaise,
    currentActorId: currentActor?.id || null,
    dealerIndex: room.dealerIndex,
    smallBlindIndex: room.smallBlindIndex,
    bigBlindIndex: room.bigBlindIndex,
    players,
    handOver: room.handOver,
    handResults: room.handResults || null,
    status: room.status,
    gameModeVotes: room.gameModeVotes || {},
    pendingGameMode: room.pendingGameMode || null,
    messages: room.messages || [],
    // Admin extras
    ...(isAdmin && {
      fullDeck: room.deck,
      deckIndex: room.deckIndex,
      remainingCommunityCards: room.deck ? room.deck.slice(
        room.deckIndex,
        room.deckIndex + (room.phase === 'preflop' ? 5 : room.phase === 'flop' ? 2 : room.phase === 'turn' ? 1 : 0)
      ) : [],
    }),
  };
}

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentRoomCode = null;
    let currentPlayerId = null;
    let isAdmin = false;

    socket.on('create_room', ({ playerName, gameMode, avatar }, cb) => {
      const code = generateRoomCode();
      const playerId = uuidv4();
      const room = {
        code,
        hostId: playerId,
        gameMode: gameMode || 'holdem',
        status: 'lobby',
        players: [{
          id: playerId,
          name: playerName || 'Host',
          chips: 1000,
          socketId: socket.id,
          holeCards: [],
          currentBet: 0,
          folded: false,
          allIn: false,
          lastAction: null,
          isConnected: true,
          avatar: avatar || null,
        }],
        communityCards: [],
        pot: 0,
        currentBet: 0,
        minRaise: 20,
        phase: null,
        deck: [],
        deckIndex: 0,
        handOver: false,
        handResults: null,
        gameModeVotes: {},
        pendingGameMode: null,
        messages: [],
      };
      rooms.set(code, room);
      currentRoomCode = code;
      currentPlayerId = playerId;
      socket.join(code);
      cb({ success: true, roomCode: code, playerId });
    });

    socket.on('join_room', ({ roomCode, playerName, avatar }, cb) => {
      const room = rooms.get(roomCode?.toUpperCase());
      if (!room) return cb({ error: 'Room not found' });
      if (room.status !== 'lobby') return cb({ error: 'Game already started' });
      if (room.players.length >= 8) return cb({ error: 'Room is full' });

      const playerId = uuidv4();
      room.players.push({
        id: playerId,
        name: playerName || `Player ${room.players.length + 1}`,
        chips: 1000,
        socketId: socket.id,
        holeCards: [],
        currentBet: 0,
        folded: false,
        allIn: false,
        lastAction: null,
        isConnected: true,
        avatar: avatar || null,
      });

      currentRoomCode = roomCode.toUpperCase();
      currentPlayerId = playerId;
      socket.join(currentRoomCode);
      io.to(currentRoomCode).emit('room_update', sanitizeRoomForPlayer(room, null, false));
      cb({ success: true, playerId });
    });

    socket.on('rejoin_room', ({ roomCode, playerId }, cb) => {
      const room = rooms.get(roomCode?.toUpperCase());
      if (!room) return cb({ error: 'Room not found' });
      const player = room.players.find(p => p.id === playerId);
      if (!player) return cb({ error: 'Player not found' });

      player.socketId = socket.id;
      player.isConnected = true;
      currentRoomCode = roomCode.toUpperCase();
      currentPlayerId = playerId;
      socket.join(currentRoomCode);

      io.to(currentRoomCode).emit('room_update', sanitizeRoomForPlayer(room, null, false));
      cb({ success: true, roomState: sanitizeRoomForPlayer(room, playerId, false) });
    });

    socket.on('get_room', ({ roomCode, playerId }, cb) => {
      const room = rooms.get(roomCode);
      if (!room) return cb({ error: 'Room not found' });
      cb({ roomState: sanitizeRoomForPlayer(room, playerId, isAdmin) });
    });

    socket.on('update_player', ({ playerId: targetId, name, chips }, cb) => {
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return cb?.({ error: 'Not authorized' });
      const player = room.players.find(p => p.id === targetId);
      if (!player) return cb?.({ error: 'Player not found' });
      if (name !== undefined) player.name = name;
      if (chips !== undefined) player.chips = chips;
      io.to(currentRoomCode).emit('room_update', sanitizeRoomForPlayer(room, null, false));
      cb?.({ success: true });
    });

    socket.on('add_chips', ({ playerId: targetId, amount }, cb) => {
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return cb?.({ error: 'Not authorized' });
      const player = room.players.find(p => p.id === targetId);
      if (!player) return cb?.({ error: 'Player not found' });
      const amt = parseInt(amount);
      if (!amt || amt <= 0) return cb?.({ error: 'Invalid amount' });
      player.chips += amt;
      broadcastRoomToAll(io, room);
      cb?.({ success: true });
    });

    socket.on('set_game_mode', ({ gameMode }, cb) => {
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return cb?.({ error: 'Not authorized' });
      room.gameMode = gameMode;
      io.to(currentRoomCode).emit('room_update', sanitizeRoomForPlayer(room, null, false));
      cb?.({ success: true });
    });

    socket.on('start_game', (cb) => {
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return cb?.({ error: 'Not authorized' });
      if (room.players.length < 2) return cb?.({ error: 'Need at least 2 players' });

      room.status = 'playing';
      room.dealerIndex = 0;
      dealHand(room);
      broadcastRoomToAll(io, room);
      cb?.({ success: true });
    });

    socket.on('player_action', ({ action, amount }, cb) => {
      const room = rooms.get(currentRoomCode);
      if (!room || room.status !== 'playing') return cb?.({ error: 'Game not active' });

      const result = processAction(room, currentPlayerId, action, amount);
      if (result.error) return cb?.({ error: result.error });

      if (result.phaseResult) {
        room.handResults = result.phaseResult;
        if (room.handOver) {
          room.status = 'hand_over';
        }
      }

      broadcastRoomToAll(io, room);
      cb?.({ success: true });
    });

    socket.on('next_hand', (cb) => {
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return cb?.({ error: 'Not authorized' });

      // Apply pending game mode vote
      if (room.pendingGameMode) {
        room.gameMode = room.pendingGameMode;
        room.pendingGameMode = null;
        room.gameModeVotes = {};
      }

      // Remove busted players
      room.players = room.players.filter(p => p.chips > 0 || p.isConnected);
      room.players.forEach(p => {
        p.holeCards = [];
        p.currentBet = 0;
        p.totalContributed = 0;
        p.folded = false;
        p.allIn = false;
        p.lastAction = null;
      });

      if (room.players.filter(p => p.chips > 0).length < 2) {
        room.status = 'lobby';
        room.phase = null;
        io.to(currentRoomCode).emit('room_update', sanitizeRoomForPlayer(room, null, false));
        return cb?.({ success: true });
      }

      room.status = 'playing';
      room.handResults = null;
      room.handOver = false;
      dealHand(room);
      broadcastRoomToAll(io, room);
      cb?.({ success: true });
    });

    socket.on('vote_game_mode', ({ gameMode }, cb) => {
      const room = rooms.get(currentRoomCode);
      if (!room) return cb?.({ error: 'Room not found' });

      room.gameModeVotes = room.gameModeVotes || {};
      room.gameModeVotes[currentPlayerId] = gameMode;

      const votes = Object.values(room.gameModeVotes);
      const total = room.players.length;
      const forChange = votes.filter(v => v !== room.gameMode).length;

      if (forChange > total / 2) {
        room.pendingGameMode = gameMode;
      }

      broadcastRoomToAll(io, room);
      cb?.({ success: true });
    });

    socket.on('send_message', ({ text, emoji }, cb) => {
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const player = room.players.find(p => p.id === currentPlayerId);
      if (!player) return;

      const msg = {
        id: uuidv4(),
        playerId: currentPlayerId,
        playerName: player.name,
        text: text || null,
        emoji: emoji || null,
        timestamp: Date.now(),
      };
      room.messages = room.messages || [];
      room.messages.push(msg);
      if (room.messages.length > 50) room.messages = room.messages.slice(-50);

      io.to(currentRoomCode).emit('room_update', sanitizeRoomForPlayer(room, null, false));
      cb?.({ success: true });
    });

    // Admin authentication
    socket.on('admin_auth', ({ password }, cb) => {
      if (password === ADMIN_PASSWORD) {
        const token = ADMIN_TOKEN_PREFIX + crypto.randomBytes(16).toString('hex');
        adminSessions.add(token);
        isAdmin = true;
        cb({ success: true, token });
      } else {
        cb({ success: false });
      }
    });

    socket.on('admin_verify', ({ token }, cb) => {
      if (token && adminSessions.has(token)) {
        isAdmin = true;
        cb({ success: true });
        // Send admin view if in a room
        if (currentRoomCode) {
          const room = rooms.get(currentRoomCode);
          if (room) socket.emit('room_update', sanitizeRoomForPlayer(room, currentPlayerId, true));
        }
      } else {
        cb({ success: false });
      }
    });

    socket.on('admin_get_room', ({ roomCode }, cb) => {
      if (!isAdmin) return cb({ error: 'Not authorized' });
      const room = rooms.get(roomCode || currentRoomCode);
      if (!room) return cb({ error: 'Room not found' });
      cb({ roomState: sanitizeRoomForPlayer(room, currentPlayerId, true) });
    });

    socket.on('disconnect', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const player = room.players.find(p => p.id === currentPlayerId);
      if (player) {
        player.isConnected = false;
        io.to(currentRoomCode).emit('room_update', sanitizeRoomForPlayer(room, null, false));
      }
    });
  });
}

function broadcastRoomToAll(io, room) {
  // Send each player their own view (hides other's cards)
  room.players.forEach(p => {
    const sock = [...io.sockets.sockets.values()].find(s => s.id === p.socketId);
    if (sock) {
      sock.emit('room_update', sanitizeRoomForPlayer(room, p.id, false));
    }
  });
  // Also broadcast to room (for spectators / admin overlay)
  io.to(room.code).emit('room_update_public', sanitizeRoomForPlayer(room, null, false));
}

module.exports = { setupSocketHandlers };
