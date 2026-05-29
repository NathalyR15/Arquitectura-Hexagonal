require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const SQLiteUserRepository = require('./infrastructure/SQLiteUserRepository');
const UserUseCases = require('./application/UserUseCases');
const createRouter = require('./adapters/userRoutes');

// Composición de la aplicación (Arquitectura Hexagonal)
const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, '../data/users.db');

// Infraestructura
const userRepository = new SQLiteUserRepository();

// Casos de uso
const userUseCases = new UserUseCases(userRepository);

// Adaptadores HTTP
app.use(cors());
app.use(express.json());
app.use('/api', createRouter(userUseCases));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-validation', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🚀 Servicio 1 (Usuarios) corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /api/auth/validate`);
  console.log(`   GET  /api/users`);
  console.log(`   POST /api/users`);
  console.log(`   PUT  /api/users/:id`);
  console.log(`   DELETE /api/users/:id`);
  console.log(`   POST /api/users/:id/penalty`);
});
