// Puerto (interfaz) del repositorio de usuarios
// En arquitectura hexagonal, esto define el contrato que debe cumplir cualquier adaptador

class UserRepositoryPort {
  async findByUsername(username) { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async findAll() { throw new Error('Not implemented'); }
  async create(userData) { throw new Error('Not implemented'); }
  async update(id, userData) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
  async applyPenalty(userId, amount) { throw new Error('Not implemented'); }
}

module.exports = UserRepositoryPort;
