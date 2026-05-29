const AttendanceRecord = require('../domain/AttendanceRecord');

// Casos de uso del servicio de registros
class AttendanceUseCases {
  constructor(recordRepository, userServiceClient) {
    this.recordRepository = recordRepository;
    this.userServiceClient = userServiceClient; // cliente HTTP al servicio 1
  }

  // Registrar entrada de empleado
  async checkIn(userId, username, fullName, userSchedule) {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5); // "HH:MM"
    const dateStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    // Verificar si ya hay una entrada activa hoy
    const existing = await this.recordRepository.findActiveRecord(userId, dateStr);
    if (existing) {
      throw new Error('El empleado ya tiene una entrada registrada hoy y aún está dentro');
    }

    const record = new AttendanceRecord({
      userId,
      username,
      fullName,
      checkIn: timeStr,
      checkOut: null,
      scheduledStart: userSchedule.scheduleStart,
      scheduledEnd: userSchedule.scheduleEnd,
      status: 'inside',
      date: dateStr
    });

    const saved = await this.recordRepository.create(record);

    // Calcular y aplicar multa por entrada tarde
    const lateMinutes = record.calculateLateMinutes();
    if (lateMinutes > 0) {
      await this.userServiceClient.applyPenalty(userId, lateMinutes);
      await this.recordRepository.updatePenalty(saved.id, lateMinutes, 0);
    }

    return { ...saved, lateMinutes, violation: record.getViolation() };
  }

  // Registrar salida de empleado
  async checkOut(userId) {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const dateStr = now.toISOString().slice(0, 10);

    const record = await this.recordRepository.findActiveRecord(userId, dateStr);
    if (!record) {
      throw new Error('No hay entrada activa para este empleado hoy');
    }

    const updated = await this.recordRepository.updateCheckOut(record.id, timeStr);

    const attendance = new AttendanceRecord({
      ...record,
      checkOut: timeStr,
    });

    // Calcular multa por salida temprana
    const earlyMinutes = attendance.calculateEarlyLeaveMinutes();
    if (earlyMinutes > 0) {
      await this.userServiceClient.applyPenalty(userId, earlyMinutes);
      await this.recordRepository.updatePenalty(record.id, record.penaltyMinutes, earlyMinutes);
    }

    return { ...updated, earlyMinutes, violation: attendance.getViolation() };
  }

  // Obtener todos los registros
  async getAllRecords(filters = {}) {
    return this.recordRepository.findAll(filters);
  }

  // Obtener registros por empleado
  async getRecordsByUser(userId) {
    return this.recordRepository.findByUser(userId);
  }

  // Obtener estado actual (dentro/fuera) de todos los empleados
  async getCurrentStatus() {
    return this.recordRepository.getCurrentStatus();
  }

  // Obtener resumen del día
  async getDailySummary(date) {
    const dateStr = date || new Date().toISOString().slice(0, 10);
    return this.recordRepository.getDailySummary(dateStr);
  }

  // Obtener estadísticas generales
  async getStats() {
    return this.recordRepository.getStats();
  }
}

module.exports = AttendanceUseCases;
