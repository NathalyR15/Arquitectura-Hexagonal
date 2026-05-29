// Dominio: Entidad Usuario (Arquitectura Hexagonal)
class User {
  constructor({ id, username, password, fullName, salary, scheduleStart, scheduleEnd, role, active }) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.fullName = fullName;
    this.salary = salary;
    this.scheduleStart = scheduleStart; // "08:00"
    this.scheduleEnd = scheduleEnd;     // "17:00"
    this.role = role || 'employee';     // 'employee' | 'admin'
    this.active = active !== undefined ? active : 1;
  }

  isAdmin() {
    return this.role === 'admin';
  }

  getScheduleStartMinutes() {
    const [h, m] = this.scheduleStart.split(':').map(Number);
    return h * 60 + m;
  }

  getScheduleEndMinutes() {
    const [h, m] = this.scheduleEnd.split(':').map(Number);
    return h * 60 + m;
  }

  toPublic() {
    return {
      id: this.id,
      username: this.username,
      fullName: this.fullName,
      salary: this.salary,
      scheduleStart: this.scheduleStart,
      scheduleEnd: this.scheduleEnd,
      role: this.role,
      active: this.active
    };
  }
}

module.exports = User;
