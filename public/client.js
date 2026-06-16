// Client-side game logic (vanilla JS)
const socket = io();
let myId = null;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const keys = {};
let mouse = { x: 0, y: 0, down: false };

const state = { players: {}, bullets: [] };

socket.on('init', (d) => { myId = d.id; });
socket.on('state', (s) => {
  state.players = s.players;
  state.bullets = s.bullets;
  draw();
  updateLeaderboard();
});

// Input handling
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', (e) => { mouse.down = true; shoot(); });
canvas.addEventListener('mouseup', (e) => { mouse.down = false; });

function shoot() {
  const me = state.players[myId];
  if (!me) return;
  const angle = Math.atan2(mouse.y - me.y, mouse.x - me.x);
  socket.emit('shoot', { angle });
}

// Send movement at fixed interval
setInterval(() => {
  if (!myId) return;
  const dx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  const dy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
  const me = state.players[myId];
  let angle = 0;
  if (me) angle = Math.atan2(mouse.y - me.y, mouse.x - me.x);
  socket.emit('move', { dx, dy, angle });
  if (mouse.down) {
    // automatic fire (rate limited by server side behavior simple)
    shoot();
  }
}, 1000 / 30);

// Rendering
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw players
  for (const id in state.players) {
    const p = state.players[id];
    ctx.save();
    ctx.translate(p.x, p.y);
    // body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    // gun direction
    ctx.rotate(p.angle || 0);
    ctx.fillStyle = '#222';
    ctx.fillRect(8, -4, 12, 8);
    ctx.restore();

    // name/score
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.fillText(p.score || '0', p.x - 6, p.y - 18);
  }

  // draw bullets
  ctx.fillStyle = '#000';
  for (const b of state.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateLeaderboard() {
  const el = document.getElementById('leaderboard');
  const arr = Object.values(state.players).sort((a, b) => b.score - a.score).slice(0, 10);
  el.innerHTML = '<h3>Leaderboard</h3>' + arr.map(p => `<div style="color:${p.color}">${p.id.slice(0,6)}: ${p.score}</div>`).join('');
}
