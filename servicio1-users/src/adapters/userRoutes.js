const express = require('express');

// Adaptador HTTP (Puerto de entrada - Arquitectura Hexagonal)
function createRouter(userUseCases) {
  const router = express.Router();

  // POST /api/auth/validate - Validar usuario (simula huella dactilar)
  router.post('/auth/validate', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
      }
      const result = await userUseCases.validateUser(username, password);
      if (!result.valid) {
        return res.status(401).json({ success: false, message: result.reason });
      }
      res.json({ success: true, user: result.user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/users - Obtener todos los usuarios
  router.get('/users', async (req, res) => {
    try {
      const users = await userUseCases.getAllUsers();
      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/users/:id - Obtener usuario por ID
  router.get('/users/:id', async (req, res) => {
    try {
      const user = await userUseCases.getUserById(req.params.id);
      res.json({ success: true, user });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  });

  // POST /api/users - Crear usuario
  router.post('/users', async (req, res) => {
    try {
      const user = await userUseCases.createUser(req.body);
      res.status(201).json({ success: true, user: user.toPublic() });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // PUT /api/users/:id - Actualizar usuario
  router.put('/users/:id', async (req, res) => {
    try {
      const user = await userUseCases.updateUser(req.params.id, req.body);
      res.json({ success: true, user: user.toPublic() });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // DELETE /api/users/:id - Desactivar usuario
  router.delete('/users/:id', async (req, res) => {
    try {
      await userUseCases.deleteUser(req.params.id);
      res.json({ success: true, message: 'Usuario desactivado' });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  });

  // POST /api/users/:id/penalty - Aplicar descuento por minutos
  router.post('/users/:id/penalty', async (req, res) => {
    try {
      const { minutes } = req.body;
      const result = await userUseCases.applyPenalty(req.params.id, minutes);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = createRouter;
