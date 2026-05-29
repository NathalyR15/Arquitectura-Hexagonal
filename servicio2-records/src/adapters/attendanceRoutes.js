const express = require('express');

function createRouter(attendanceUseCases, userServiceClient, wss) {
  const router = express.Router();

  // Broadcast a todos los clientes WebSocket conectados
  function broadcast(data) {
    if (!wss) return;
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(data));
      }
    });
  }

  // POST /api/attendance/checkin - Registrar entrada
  router.post('/attendance/checkin', async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validar usuario con Servicio 1
      const authResult = await userServiceClient.validateUser(username, password);
      if (!authResult.success) {
        return res.status(401).json({ success: false, message: authResult.message });
      }

      const user = authResult.user;
      const record = await attendanceUseCases.checkIn(
        user.id, user.username, user.fullName,
        { scheduleStart: user.scheduleStart, scheduleEnd: user.scheduleEnd }
      );

      // Notificar vía WebSocket
      broadcast({ event: 'CHECK_IN', record, timestamp: new Date().toISOString() });

      res.status(201).json({ success: true, record, message: `Bienvenido, ${user.fullName}!` });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // POST /api/attendance/checkout - Registrar salida
  router.post('/attendance/checkout', async (req, res) => {
    try {
      const { username, password } = req.body;

      const authResult = await userServiceClient.validateUser(username, password);
      if (!authResult.success) {
        return res.status(401).json({ success: false, message: authResult.message });
      }

      const record = await attendanceUseCases.checkOut(authResult.user.id);

      broadcast({ event: 'CHECK_OUT', record, timestamp: new Date().toISOString() });

      res.json({ success: true, record, message: `Hasta luego, ${authResult.user.fullName}!` });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // GET /api/attendance - Todos los registros (con filtros opcionales ?date=&userId=)
  router.get('/attendance', async (req, res) => {
    try {
      const records = await attendanceUseCases.getAllRecords(req.query);
      res.json({ success: true, records });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/attendance/status - Estado actual (dentro/fuera) de todos
  router.get('/attendance/status', async (req, res) => {
    try {
      const status = await attendanceUseCases.getCurrentStatus();
      res.json({ success: true, status });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/attendance/summary - Resumen del día
  router.get('/attendance/summary', async (req, res) => {
    try {
      const summary = await attendanceUseCases.getDailySummary(req.query.date);
      res.json({ success: true, summary });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/attendance/stats - Estadísticas generales
  router.get('/attendance/stats', async (req, res) => {
    try {
      const stats = await attendanceUseCases.getStats();
      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/attendance/user/:userId - Registros por usuario
  router.get('/attendance/user/:userId', async (req, res) => {
    try {
      const records = await attendanceUseCases.getRecordsByUser(req.params.userId);
      res.json({ success: true, records });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = createRouter;
