const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { setupSocketHandlers } = require('./roomManager');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

// Serve built React client in production
if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  // Express 5 wildcard — catch remaining routes and serve index.html (SPA fallback)
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Poker server running on port ${PORT}`);
});
