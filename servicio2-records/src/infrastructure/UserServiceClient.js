const fetch = require('node-fetch');

// Cliente HTTP para comunicarse con el Servicio 1 (puerto de salida - Arquitectura Hexagonal)
class UserServiceClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'http://localhost:3001';
  }

  async validateUser(username, password) {
    const res = await fetch(`${this.baseUrl}/api/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  }

  async getUserById(id) {
    const res = await fetch(`${this.baseUrl}/api/users/${id}`);
    return res.json();
  }

  async applyPenalty(userId, minutes) {
    const res = await fetch(`${this.baseUrl}/api/users/${userId}/penalty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes })
    });
    return res.json();
  }
}

module.exports = UserServiceClient;
