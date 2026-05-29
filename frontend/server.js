require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE1 = process.env.SERVICE1_URL || 'http://localhost:3001';
const SERVICE2 = process.env.SERVICE2_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Proxy al Servicio 1 (usuarios) ───────────────────────────────────────────
app.post('/proxy/auth/validate', async (req, res) => {
  const r = await fetch(`${SERVICE1}/api/auth/validate`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body) });
  res.json(await r.json());
});

app.get('/proxy/users', async (req, res) => {
  const r = await fetch(`${SERVICE1}/api/users`);
  res.json(await r.json());
});

app.post('/proxy/users', async (req, res) => {
  const r = await fetch(`${SERVICE1}/api/users`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body) });
  res.json(await r.json());
});

app.put('/proxy/users/:id', async (req, res) => {
  const r = await fetch(`${SERVICE1}/api/users/${req.params.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body) });
  res.json(await r.json());
});

app.delete('/proxy/users/:id', async (req, res) => {
  const r = await fetch(`${SERVICE1}/api/users/${req.params.id}`, { method: 'DELETE' });
  res.json(await r.json());
});

// ─── Proxy al Servicio 2 (registros) ──────────────────────────────────────────
app.post('/proxy/checkin', async (req, res) => {
  const r = await fetch(`${SERVICE2}/api/attendance/checkin`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body) });
  res.json(await r.json());
});

app.post('/proxy/checkout', async (req, res) => {
  const r = await fetch(`${SERVICE2}/api/attendance/checkout`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(req.body) });
  res.json(await r.json());
});

app.get('/proxy/attendance', async (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const r = await fetch(`${SERVICE2}/api/attendance${qs ? '?' + qs : ''}`);
  res.json(await r.json());
});

app.get('/proxy/attendance/status', async (req, res) => {
  const r = await fetch(`${SERVICE2}/api/attendance/status`);
  res.json(await r.json());
});

app.get('/proxy/attendance/summary', async (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const r = await fetch(`${SERVICE2}/api/attendance/summary${qs ? '?' + qs : ''}`);
  res.json(await r.json());
});

app.get('/proxy/attendance/stats', async (req, res) => {
  const r = await fetch(`${SERVICE2}/api/attendance/stats`);
  res.json(await r.json());
});

app.get('/proxy/attendance/user/:id', async (req, res) => {
  const r = await fetch(`${SERVICE2}/api/attendance/user/${req.params.id}`);
  res.json(await r.json());
});

// Health check de ambos servicios
app.get('/health', async (req, res) => {
  try {
    const [s1, s2] = await Promise.all([
      fetch(`${SERVICE1}/health`).then(r => r.json()).catch(() => ({ status: 'offline' })),
      fetch(`${SERVICE2}/health`).then(r => r.json()).catch(() => ({ status: 'offline' }))
    ]);
    res.json({ frontend: 'ok', service1: s1, service2: s2 });
  } catch(e) {
    res.json({ frontend: 'ok', error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend corriendo en http://localhost:${PORT}`);
  console.log(`   → Servicio 1: ${SERVICE1}`);
  console.log(`   → Servicio 2: ${SERVICE2}`);
});
