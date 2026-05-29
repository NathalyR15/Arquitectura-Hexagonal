const bcrypt = require('bcryptjs');

// Casos de uso (Application Layer - Arquitectura Hexagonal)

class UserUseCases {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // Validar credenciales de usuario (simula huella dactilar con usuario+contraseña)
  async validateUser(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return { valid: false, reason: 'Usuario no registrado en el sistema' };
    }
    if (!user.active) {
      return { valid: false, reason: 'Usuario inactivo' };
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { valid: false, reason: 'Credenciales incorrectas' };
    }
    return { valid: true, user: user.toPublic() };
  }

  // Obtener todos los usuarios
  async getAllUsers() {
    return this.userRepository.findAll();
  }

  // Obtener usuario por ID
  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('Usuario no encontrado');
    return user.toPublic();
  }

  // Registrar nuevo usuario
  async createUser(data) {
    const existing = await this.userRepository.findByUsername(data.username);
    if (existing) throw new Error('El nombre de usuario ya existe');
    if (!data.salary || data.salary <= 0) throw new Error('Salario inválido');
    if (!data.scheduleStart || !data.scheduleEnd) throw new Error('Horario requerido');
    const hashed = await bcrypt.hash(data.password, 10);
    return this.userRepository.create({ ...data, password: hashed });
  }

  // Actualizar usuario
  async updateUser(id, data) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('Usuario no encontrado');
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.userRepository.update(id, data);
  }

  // Eliminar usuario
  async deleteUser(id) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('Usuario no encontrado');
    return this.userRepository.delete(id);
  }

  // Aplicar descuento de salario (llamado desde servicio 2)
  async applyPenalty(userId, minutes) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    const penalty = (user.salary * 0.005) * minutes; // 0.5% por minuto
    await this.userRepository.applyPenalty(userId, penalty);
    return { userId, minutes, penalty, newSalary: user.salary - penalty };
  }
}

module.exports = UserUseCases;
