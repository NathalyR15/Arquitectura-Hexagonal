require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const SQLiteRecordRepository = require('./infrastructure/SQLiteRecordRepository');
const UserServiceClient = require('./infrastructure/UserServiceClient');
const AttendanceUseCases = require('./application/AttendanceUseCases');
const createRouter = require('./adapters/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 3002;
const SERVICE1_URL = process.env.SERVICE1_URL || 'http://localhost:3001';


// Infraestructura
const recordRepository = new SQLiteRecordRepository();
const userServiceClient = new UserServiceClient(SERVICE1_URL);

// Casos de uso
const attendanceUseCases = new AttendanceUseCases(recordRepository, userServiceClient);

// Servidor HTTP
const server = http.createServer(app);

// WebSocket Server (para actualizaciones en tiempo real)
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🔌 Cliente WebSocket conectado');
  ws.send(JSON.stringify({ event: 'CONNECTED', message: 'Conectado al servicio de registros en tiempo real' }));
  ws.on('close', () => console.log('🔌 Cliente WebSocket desconectado'));
});

// Adaptadores HTTP
app.use(cors());
app.use(express.json());
app.use('/api', createRouter(attendanceUseCases, userServiceClient, wss));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'attendance-records', port: PORT, wsClients: wss.clients.size });
});

server.listen(PORT, () => {
  console.log(`🚀 Servicio 2 (Registros) corriendo en http://localhost:${PORT}`);
  console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   POST /api/attendance/checkin`);
  console.log(`   POST /api/attendance/checkout`);
  console.log(`   GET  /api/attendance`);
  console.log(`   GET  /api/attendance/status`);
  console.log(`   GET  /api/attendance/summary`);
  console.log(`   GET  /api/attendance/stats`);
});
