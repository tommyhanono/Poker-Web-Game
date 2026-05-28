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

// Serve built React client in production
if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setupSocketHandlers(io);

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Poker server running on port ${PORT}`);
});
