const mysql = require('mysql2/promise');

class SQLiteRecordRepository {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'records_db',
      waitForConnections: true,
      connectionLimit: 10,
    });
    this._initDB();
  }

  async _initDB() {
    const conn = await this.pool.getConnection();
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(100) NOT NULL,
        full_name VARCHAR(200) NOT NULL,
        check_in VARCHAR(20) NOT NULL,
        check_out VARCHAR(20),
        scheduled_start VARCHAR(5) NOT NULL,
        scheduled_end VARCHAR(5) NOT NULL,
        penalty_minutes_late INT DEFAULT 0,
        penalty_minutes_early INT DEFAULT 0,
        penalty_amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'inside',
        date VARCHAR(10) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    conn.release();
  }

  async create(record) {
    const [result] = await this.pool.execute(
      `INSERT INTO attendance_records
        (user_id, username, full_name, check_in, scheduled_start, scheduled_end, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.userId, record.username, record.fullName,
       record.checkIn, record.scheduledStart, record.scheduledEnd,
       record.status, record.date]
    );
    const [rows] = await this.pool.execute('SELECT * FROM attendance_records WHERE id = ?', [result.insertId]);
    return this._toRecord(rows[0]);
  }

  async findActiveRecord(userId, date) {
    const [rows] = await this.pool.execute(
      `SELECT * FROM attendance_records WHERE user_id = ? AND date = ? AND status = 'inside'`,
      [userId, date]
    );
    return rows[0] ? this._toRecord(rows[0]) : null;
  }

  async updateCheckOut(id, checkOut) {
    await this.pool.execute(
      `UPDATE attendance_records SET check_out = ?, status = 'outside' WHERE id = ?`,
      [checkOut, id]
    );
    const [rows] = await this.pool.execute('SELECT * FROM attendance_records WHERE id = ?', [id]);
    return this._toRecord(rows[0]);
  }

  async updatePenalty(id, lateMinutes, earlyMinutes) {
    await this.pool.execute(
      `UPDATE attendance_records SET penalty_minutes_late = ?, penalty_minutes_early = ? WHERE id = ?`,
      [lateMinutes, earlyMinutes, id]
    );
  }

  async findAll(filters = {}) {
    let query = 'SELECT * FROM attendance_records WHERE 1=1';
    const params = [];
    if (filters.date)   { query += ' AND date = ?';    params.push(filters.date); }
    if (filters.userId) { query += ' AND user_id = ?'; params.push(filters.userId); }
    query += ' ORDER BY created_at DESC LIMIT 200';
    const [rows] = await this.pool.execute(query, params);
    return rows.map(r => this._toRecord(r));
  }

  async findByUser(userId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM attendance_records WHERE user_id = ? ORDER BY date DESC, check_in DESC',
      [userId]
    );
    return rows.map(r => this._toRecord(r));
  }

  async getCurrentStatus() {
    const [rows] = await this.pool.execute(`
      SELECT a.* FROM attendance_records a
      INNER JOIN (
        SELECT user_id, MAX(created_at) as max_created
        FROM attendance_records GROUP BY user_id
      ) b ON a.user_id = b.user_id AND a.created_at = b.max_created
      ORDER BY a.full_name
    `);
    return rows.map(r => this._toRecord(r));
  }

  async getDailySummary(date) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM attendance_records WHERE date = ? ORDER BY check_in',
      [date]
    );
    const records = rows.map(r => this._toRecord(r));
    return {
      date,
      total: records.length,
      inside: records.filter(r => r.status === 'inside').length,
      outside: records.filter(r => r.status === 'outside').length,
      withViolations: records.filter(r => r.penaltyMinutesLate > 0 || r.penaltyMinutesEarly > 0).length,
      records
    };
  }

  async getStats() {
    const [[{ total }]]   = await this.pool.execute('SELECT COUNT(*) as total FROM attendance_records');
    const [[{ inside }]]  = await this.pool.execute(`SELECT COUNT(*) as inside FROM attendance_records WHERE status = 'inside'`);
    const [[{ violations }]] = await this.pool.execute('SELECT COUNT(*) as violations FROM attendance_records WHERE penalty_minutes_late > 0 OR penalty_minutes_early > 0');
    const today = new Date().toISOString().slice(0, 10);
    const [[{ todayCount }]] = await this.pool.execute('SELECT COUNT(*) as todayCount FROM attendance_records WHERE date = ?', [today]);
    return { total, inside, outside: total - inside, violations, todayCount };
  }

  _toRecord(row) {
    return {
      id: row.id,
      userId: row.user_id,
      username: row.username,
      fullName: row.full_name,
      checkIn: row.check_in,
      checkOut: row.check_out,
      scheduledStart: row.scheduled_start,
      scheduledEnd: row.scheduled_end,
      penaltyMinutesLate: row.penalty_minutes_late || 0,
      penaltyMinutesEarly: row.penalty_minutes_early || 0,
      penaltyAmount: row.penalty_amount || 0,
      status: row.status,
      date: row.date,
      createdAt: row.created_at
    };
  }
}

module.exports = SQLiteRecordRepository;