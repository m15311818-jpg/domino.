import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { ServerRoomState, RoomState, Player } from './src/types/domino';
import {
  initializeRound,
  applyPlayTile,
  applyDrawTile,
  applyPassTurn,
} from './src/utils/dominoEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle upgrade only for /ws endpoint, leaving other upgrade paths (e.g. Vite) intact
server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
      return;
    }
  } catch {
    // Ignore URL parse errors
  }
});

app.use(express.json());

// In-memory store for rooms
const rooms = new Map<string, ServerRoomState>();

// Track connected WebSocket clients per room
interface SocketClient {
  ws: WebSocket;
  roomId: string;
  role: 'host' | 'player' | 'spectator';
  playerIndex?: number;
}
const socketClients = new Set<SocketClient>();

// Helper to sanitize room state for client consumption
function sanitizeRoom(room: ServerRoomState, clientRole?: string, playerIndex?: number): RoomState {
  // If a player is requesting, they only see their own hand; opponent's hand tiles are hidden (replaced with [0,0])
  const sanitizedPlayers: [Player | null, Player | null] = [
    room.players[0]
      ? {
          ...room.players[0],
          hand:
            clientRole === 'host' || playerIndex === 0 || room.status === 'round_ended' || room.status === 'match_ended'
              ? room.players[0].hand
              : room.players[0].hand.map(() => [0, 0] as [number, number]),
        }
      : null,
    room.players[1]
      ? {
          ...room.players[1],
          hand:
            clientRole === 'host' || playerIndex === 1 || room.status === 'round_ended' || room.status === 'match_ended'
              ? room.players[1].hand
              : room.players[1].hand.map(() => [0, 0] as [number, number]),
        }
      : null,
  ];

  return {
    id: room.id,
    hostWallet: room.hostWallet,
    pin: room.pin,
    betAmount: room.betAmount,
    targetScore: room.targetScore,
    status: room.status,
    players: sanitizedPlayers,
    board: room.board,
    boneyardCount: room.boneyard.length,
    turnIndex: room.turnIndex,
    starterIndex: room.starterIndex,
    roundNumber: room.roundNumber,
    winnerPlayerIndex: room.winnerPlayerIndex,
    matchWinnerIndex: room.matchWinnerIndex,
    roundEndReason: room.roundEndReason,
    payoutStatus: room.payoutStatus,
    payoutTxRef: room.payoutTxRef,
    chatMessages: room.chatMessages,
    logs: room.logs,
    createdAt: room.createdAt,
  };
}

// Broadcast room state to all connected WS clients for that room
function broadcastRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  socketClients.forEach((client) => {
    if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
      const sanitized = sanitizeRoom(room, client.role, client.playerIndex);
      client.ws.send(JSON.stringify({ type: 'room_state', room: sanitized }));
    }
  });
}

function addLog(room: ServerRoomState, text: string, type: 'info' | 'payment' | 'game' | 'payout') {
  room.logs.unshift({
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    text,
    time: Date.now(),
    type,
  });
  if (room.logs.length > 50) room.logs.pop();
}

// REST API Endpoints

// Create a new room
app.post('/api/rooms', (req: Request, res: Response) => {
  const { hostWallet, pin, betAmount, targetScore, hostName, hostIsPlayer } = req.body;

  if (!hostWallet || !pin) {
    res.status(400).json({ error: 'يرجى إدخال رقم فودافون كاش والرقم السري' });
    return;
  }

  const roomId = 'DOMINO-' + Math.floor(1000 + Math.random() * 9000);
  const hostToken = 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

  const newRoom: ServerRoomState = {
    id: roomId,
    hostWallet: hostWallet.trim(),
    pin: pin.trim(),
    betAmount: Number(betAmount) || 50,
    targetScore: Number(targetScore) || 100,
    hostToken,
    status: 'waiting_players',
    players: [null, null],
    board: { tiles: [], leftOpen: null, rightOpen: null },
    boneyard: [],
    boneyardCount: 0,
    turnIndex: 0,
    starterIndex: 0,
    roundNumber: 0,
    winnerPlayerIndex: null,
    matchWinnerIndex: null,
    roundEndReason: null,
    payoutStatus: 'unpaid',
    chatMessages: [],
    logs: [],
    createdAt: Date.now(),
  };

  addLog(newRoom, `تم إنشاء الغرفة ${roomId} برهان ${newRoom.betAmount} ج.م ومحفظة كاش ${newRoom.hostWallet}`, 'info');

  // If host also plays as Player 1
  if (hostIsPlayer && hostName) {
    newRoom.players[0] = {
      id: 'p_' + Math.random().toString(36).substring(2, 8),
      name: hostName.trim(),
      phone: hostWallet.trim(),
      hand: [],
      score: 0,
      paymentStatus: 'approved', // Host payment is auto-approved
      isReady: true,
      connected: true,
    };
    addLog(newRoom, `انضم المنظم ${hostName} كاللاعب الأول وتأكدت محفظته`, 'payment');
  }

  rooms.set(roomId, newRoom);

  res.json({
    roomId,
    hostToken,
    room: sanitizeRoom(newRoom, 'host'),
  });
});

// Get room status
app.get('/api/rooms/:id', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  const role = (req.query.role as string) || 'spectator';
  const playerIndex = req.query.playerIndex !== undefined ? Number(req.query.playerIndex) : undefined;
  const hostToken = req.query.hostToken as string;

  const isHost = hostToken === room.hostToken;
  res.json({
    room: sanitizeRoom(room, isHost ? 'host' : role, playerIndex),
    isHost,
  });
});

// Join room
app.post('/api/rooms/:id/join', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { name, phone, pin } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  if (room.pin !== pin?.trim()) {
    res.status(403).json({ error: 'الرقم السري للغرفة غير صحيح' });
    return;
  }

  // Find slot
  let slotIndex = -1;
  if (!room.players[0]) {
    slotIndex = 0;
  } else if (!room.players[1]) {
    slotIndex = 1;
  } else {
    // Check if re-joining with same phone number
    if (room.players[0]?.phone === phone.trim()) {
      slotIndex = 0;
    } else if (room.players[1]?.phone === phone.trim()) {
      slotIndex = 1;
    } else {
      res.status(400).json({ error: 'الغرفة مكتملة باللاعبين' });
      return;
    }
  }

  const existingPlayer = room.players[slotIndex];
  const player: Player = existingPlayer || {
    id: 'p_' + Math.random().toString(36).substring(2, 8),
    name: name.trim(),
    phone: phone.trim(),
    hand: [],
    score: 0,
    paymentStatus: 'pending',
    isReady: false,
    connected: true,
  };

  room.players[slotIndex] = player;
  addLog(room, `انضم اللاعب ${player.name} (${player.phone}) إلى الغرفة`, 'info');

  if (room.players[0] && room.players[1] && room.status === 'waiting_players') {
    room.status = 'payment_pending';
    addLog(room, `اكتمل اللاعبان! يرجى سداد رسوم الرهان (${room.betAmount} ج.م) لتفعيل طاولة اللعب`, 'payment');
  }

  broadcastRoom(roomId);

  res.json({
    success: true,
    playerIndex: slotIndex,
    player,
    room: sanitizeRoom(room, 'player', slotIndex),
  });
});

// Submit payment confirmation
app.post('/api/rooms/:id/submit-payment', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { playerIndex, senderPhone, transferRef } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  const player = room.players[playerIndex];
  if (!player) {
    res.status(404).json({ error: 'اللاعب غير موجود' });
    return;
  }

  player.paymentStatus = 'submitted';
  player.senderPhone = senderPhone?.trim() || player.phone;
  player.transferRef = transferRef?.trim() || 'VF-' + Math.floor(100000 + Math.random() * 900000);
  player.paymentSubmittedAt = Date.now();

  addLog(
    room,
    `أرسل اللاعب ${player.name} إشعار تحويل ${room.betAmount} ج.م من الرقم ${player.senderPhone} (مرجع: ${player.transferRef})`,
    'payment'
  );

  broadcastRoom(roomId);

  res.json({
    success: true,
    player,
    room: sanitizeRoom(room, 'player', playerIndex),
  });
});

// Host verifies payment
app.post('/api/rooms/:id/verify-payment', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { hostToken, playerIndex, status } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  if (room.hostToken !== hostToken) {
    res.status(403).json({ error: 'صلاحية غير مصرح بها للمنظم' });
    return;
  }

  const player = room.players[playerIndex];
  if (!player) {
    res.status(404).json({ error: 'اللاعب غير موجود' });
    return;
  }

  player.paymentStatus = status === 'approved' ? 'approved' : 'rejected';
  addLog(
    room,
    status === 'approved'
      ? `اعتمد المنظم استلام مبلغ الرهان (${room.betAmount} ج.م) للاعب ${player.name}`
      : `رفض المنظم تحويل اللاعب ${player.name}`,
    'payment'
  );

  // If both players approved and game not started yet, start game automatically!
  const p0 = room.players[0];
  const p1 = room.players[1];
  if (p0?.paymentStatus === 'approved' && p1?.paymentStatus === 'approved' && room.status === 'payment_pending') {
    const initialized = initializeRound(room);
    rooms.set(roomId, initialized);
    addLog(initialized, `تم تأكيد جميع التحويلات بنجاح! بدأت الجولة الأولى على الطاولة`, 'game');
    broadcastRoom(roomId);
    res.json({ success: true, room: sanitizeRoom(initialized, 'host') });
    return;
  }

  broadcastRoom(roomId);
  res.json({ success: true, room: sanitizeRoom(room, 'host') });
});

// Host record payout to winner
app.post('/api/rooms/:id/payout', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { hostToken, winnerPhone, amount, payoutTxRef } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  if (room.hostToken !== hostToken) {
    res.status(403).json({ error: 'صلاحية غير مصرح بها للمنظم' });
    return;
  }

  room.payoutStatus = 'paid';
  room.payoutTxRef = payoutTxRef || 'VFPAY-' + Math.floor(100000 + Math.random() * 900000);

  addLog(
    room,
    `تم تحويل مبلغ الجائزة (${amount} ج.م) بنجاح إلى الفائز على محفظة ${winnerPhone} (رقم الإيصال: ${room.payoutTxRef})`,
    'payout'
  );

  broadcastRoom(roomId);
  res.json({ success: true, room: sanitizeRoom(room, 'host') });
});

// Play a tile
app.post('/api/rooms/:id/play-tile', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { playerIndex, tileIndex, preferredEnd } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  const result = applyPlayTile(room, playerIndex, tileIndex, preferredEnd);
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  const playerName = room.players[playerIndex]?.name || `لاعب ${playerIndex + 1}`;
  addLog(result.nextRoom, `لعب ${playerName} قطعة دومينو على الطرف ${preferredEnd === 'left' ? 'الأيمن' : 'الأيسر'}`, 'game');

  if (result.nextRoom.roundEndReason === 'domino') {
    addLog(result.nextRoom, `دومينو! فاز ${playerName} بالجولة وأنهى جميع قطعه!`, 'game');
  } else if (result.nextRoom.roundEndReason === 'blocked') {
    addLog(result.nextRoom, `قفلة (سد)! تم احتساب النقاط وحسم الجولة لأقل رصيد قطع`, 'game');
  }

  if (result.nextRoom.matchWinnerIndex !== null) {
    const winnerName = result.nextRoom.players[result.nextRoom.matchWinnerIndex]?.name;
    addLog(result.nextRoom, `مبروك! فاز البطل ${winnerName} بكامل التحدي ومبلغ الجائزة!`, 'payout');
  }

  rooms.set(roomId, result.nextRoom);
  broadcastRoom(roomId);

  res.json({
    success: true,
    room: sanitizeRoom(result.nextRoom, 'player', playerIndex),
  });
});

// Draw a tile
app.post('/api/rooms/:id/draw-tile', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { playerIndex } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  const result = applyDrawTile(room, playerIndex);
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  const playerName = room.players[playerIndex]?.name || `لاعب ${playerIndex + 1}`;
  addLog(result.nextRoom, `سحب ${playerName} قطعة من الشكارة`, 'game');

  rooms.set(roomId, result.nextRoom);
  broadcastRoom(roomId);

  res.json({
    success: true,
    drawnTile: result.drawnTile,
    room: sanitizeRoom(result.nextRoom, 'player', playerIndex),
  });
});

// Pass turn
app.post('/api/rooms/:id/pass-turn', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { playerIndex } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  const result = applyPassTurn(room, playerIndex);
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  const playerName = room.players[playerIndex]?.name || `لاعب ${playerIndex + 1}`;
  addLog(result.nextRoom, `قال ${playerName}: باص! لا يوجد لعب متاح`, 'game');

  rooms.set(roomId, result.nextRoom);
  broadcastRoom(roomId);

  res.json({
    success: true,
    room: sanitizeRoom(result.nextRoom, 'player', playerIndex),
  });
});

// Next round / Restart match
app.post('/api/rooms/:id/next-round', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  // Next round starter switches or goes to round winner
  const nextStarter = room.winnerPlayerIndex !== null ? room.winnerPlayerIndex : (room.starterIndex === 0 ? 1 : 0);
  const nextRoom = initializeRound(room, nextStarter);

  if (room.status === 'match_ended') {
    // Reset scores for completely fresh match if desired
    if (nextRoom.players[0]) nextRoom.players[0].score = 0;
    if (nextRoom.players[1]) nextRoom.players[1].score = 0;
    nextRoom.roundNumber = 1;
    nextRoom.payoutStatus = 'unpaid';
  }

  addLog(nextRoom, `بدأت الجولة ${nextRoom.roundNumber}!`, 'game');

  rooms.set(roomId, nextRoom);
  broadcastRoom(roomId);

  res.json({
    success: true,
    room: sanitizeRoom(nextRoom),
  });
});

// Chat message
app.post('/api/rooms/:id/chat', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const { sender, text } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
    return;
  }

  const msg = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    sender: sender || 'لاعب',
    text: text.trim(),
    time: Date.now(),
  };

  room.chatMessages.push(msg);
  if (room.chatMessages.length > 40) room.chatMessages.shift();

  broadcastRoom(roomId);
  res.json({ success: true, message: msg });
});

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  let clientEntry: SocketClient | null = null;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'subscribe') {
        const { roomId, role, playerIndex, hostToken } = msg;
        const room = rooms.get(roomId);
        if (!room) return;

        const isHost = hostToken && hostToken === room.hostToken;
        clientEntry = {
          ws,
          roomId,
          role: isHost ? 'host' : (role || 'spectator'),
          playerIndex,
        };
        socketClients.add(clientEntry);

        // Send initial room state
        const sanitized = sanitizeRoom(room, clientEntry.role, clientEntry.playerIndex);
        ws.send(JSON.stringify({ type: 'room_state', room: sanitized }));
      }
    } catch {
      // Ignore invalid JSON
    }
  });

  ws.on('close', () => {
    if (clientEntry) {
      socketClients.delete(clientEntry);
    }
  });
});

// Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Domino Cash Arena Server running on http://localhost:${PORT}`);
  });
}

startServer();
