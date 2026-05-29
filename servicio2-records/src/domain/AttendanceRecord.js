// Dominio: Entidad Registro de Asistencia
class AttendanceRecord {
  constructor({ id, userId, username, fullName, checkIn, checkOut, scheduledStart, scheduledEnd, penaltyMinutes, penaltyAmount, status, date }) {
    this.id = id;
    this.userId = userId;
    this.username = username;
    this.fullName = fullName;
    this.checkIn = checkIn;       // "08:15" hora real de entrada
    this.checkOut = checkOut;     // "17:05" hora real de salida (puede ser null)
    this.scheduledStart = scheduledStart; // "08:00"
    this.scheduledEnd = scheduledEnd;     // "17:00"
    this.penaltyMinutes = penaltyMinutes || 0;
    this.penaltyAmount = penaltyAmount || 0;
    this.status = status || 'inside'; // 'inside' | 'outside'
    this.date = date; // "2024-01-15"
  }

  isLate() {
    if (!this.checkIn || !this.scheduledStart) return false;
    return this._timeToMinutes(this.checkIn) > this._timeToMinutes(this.scheduledStart);
  }

  isEarlyLeave() {
    if (!this.checkOut || !this.scheduledEnd) return false;
    return this._timeToMinutes(this.checkOut) < this._timeToMinutes(this.scheduledEnd);
  }

  calculateLateMinutes() {
    if (!this.isLate()) return 0;
    return this._timeToMinutes(this.checkIn) - this._timeToMinutes(this.scheduledStart);
  }

  calculateEarlyLeaveMinutes() {
    if (!this.isEarlyLeave()) return 0;
    return this._timeToMinutes(this.scheduledEnd) - this._timeToMinutes(this.checkOut);
  }

  _timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  getViolation() {
    const late = this.calculateLateMinutes();
    const early = this.calculateEarlyLeaveMinutes();
    if (late > 0 && early > 0) return 'Entrada tarde y salida temprana';
    if (late > 0) return `Entrada tarde (${late} min)`;
    if (early > 0) return `Salida temprana (${early} min)`;
    return 'Sin incumplimiento';
  }

  isCurrentlyInside() {
    return this.status === 'inside';
  }
}

module.exports = AttendanceRecord;
