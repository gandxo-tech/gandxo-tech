const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Game state
const players = {}; // socketId -> {id,x,y,angle,color,score}
const bullets = []; // {x,y,dx,dy,ownerId}

// Helpers
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

io.on('connection', (socket) => {
  console.log('connect', socket.id);
  const startX = rand(50, 750);
  const startY = rand(50, 550);
  const color = `hsl(${rand(0, 360)},80%,50%)`;
  players[socket.id] = { id: socket.id, x: startX, y: startY, angle: 0, color, score: 0 };

  socket.emit('init', { id: socket.id });

  socket.on('move', (data) => {
    const p = players[socket.id];
    if (!p) return;
    // data: {dx,dy,angle}
    const speed = 3;
    p.x += (data.dx || 0) * speed;
    p.y += (data.dy || 0) * speed;
    p.x = Math.max(10, Math.min(790, p.x));
    p.y = Math.max(10, Math.min(590, p.y));
    if (typeof data.angle === 'number') p.angle = data.angle;
  });

  socket.on('shoot', (data) => {
    const p = players[socket.id];
    if (!p) return;
    // data: {angle}
    const speed = 7;
    const angle = data.angle || p.angle;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    bullets.push({ x: p.x, y: p.y, dx, dy, ownerId: socket.id, ttl: 200 });
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    delete players[socket.id];
  });
});

// Game loop: update bullets and detect collisions
setInterval(() => {
  // update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx;
    b.y += b.dy;
    b.ttl -= 1;
    if (b.ttl <= 0 || b.x < 0 || b.x > 800 || b.y < 0 || b.y > 600) {
      bullets.splice(i, 1);
      continue;
    }
    // check collision with players
    for (const id in players) {
      if (id === b.ownerId) continue;
      const p = players[id];
      if (!p) continue;
      if (distance(b, p) < 15) {
        // hit
        const owner = players[b.ownerId];
        if (owner) owner.score += 1;
        // respawn victim
        p.x = rand(50, 750);
        p.y = rand(50, 550);
        bullets.splice(i, 1);
        break;
      }
    }
  }

  // broadcast state
  io.emit('state', { players, bullets });
}, 1000 / 30);

server.listen(PORT, () => console.log('Server listening on', PORT));
