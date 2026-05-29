const mysql = require('mysql2/promise');
const User = require('../domain/User');
const UserRepositoryPort = require('../domain/UserRepositoryPort');

class SQLiteUserRepository extends UserRepositoryPort {
  constructor() {
    super();
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'users_db',
      waitForConnections: true,
      connectionLimit: 10,
    });
    this._initDB();
  }

  async _initDB() {
    const conn = await this.pool.getConnection();
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(200) NOT NULL,
        salary DECIMAL(10,2) NOT NULL,
        schedule_start VARCHAR(5) NOT NULL,
        schedule_end VARCHAR(5) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS penalty_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
    conn.release();
    await this._seedData();
  }

  async _seedData() {
    const bcrypt = require('bcryptjs');
    const [rows] = await this.pool.execute('SELECT COUNT(*) as c FROM users');
    if (rows[0].c > 0) return;

    const users = [
      { username: 'admin',  password: 'admin123', fullName: 'Administrador',  salary: 15000, start: '08:00', end: '17:00', role: 'admin' },
      { username: 'jperez', password: '1234',     fullName: 'Juan Pérez',     salary: 8500,  start: '08:00', end: '17:00', role: 'employee' },
      { username: 'mgomez', password: '1234',     fullName: 'María Gómez',    salary: 9200,  start: '07:00', end: '15:00', role: 'employee' },
      { username: 'clopez', password: '1234',     fullName: 'Carlos López',   salary: 7800,  start: '14:00', end: '22:00', role: 'employee' },
      { username: 'arojas', password: '1234',     fullName: 'Ana Rojas',      salary: 10000, start: '09:00', end: '18:00', role: 'employee' },
    ];

    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      await this.pool.execute(
        'INSERT INTO users (username, password, full_name, salary, schedule_start, schedule_end, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [u.username, hashed, u.fullName, u.salary, u.start, u.end, u.role]
      );
    }
    console.log('✅ Datos iniciales cargados');
  }

  async findByUsername(username) {
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] ? this._toUser(rows[0]) : null;
  }

  async findById(id) {
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] ? this._toUser(rows[0]) : null;
  }

  async findAll() {
    const [rows] = await this.pool.execute('SELECT * FROM users ORDER BY id');
    return rows.map(r => this._toUser(r).toPublic());
  }

  async create(data) {
    const [result] = await this.pool.execute(
      'INSERT INTO users (username, password, full_name, salary, schedule_start, schedule_end, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.username, data.password, data.fullName, data.salary, data.scheduleStart, data.scheduleEnd, data.role || 'employee']
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    if (data.fullName)      { fields.push('full_name = ?');      values.push(data.fullName); }
    if (data.password)      { fields.push('password = ?');       values.push(data.password); }
    if (data.salary)        { fields.push('salary = ?');         values.push(data.salary); }
    if (data.scheduleStart) { fields.push('schedule_start = ?'); values.push(data.scheduleStart); }
    if (data.scheduleEnd)   { fields.push('schedule_end = ?');   values.push(data.scheduleEnd); }
    if (data.role)          { fields.push('role = ?');           values.push(data.role); }
    if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active); }
    values.push(id);
    await this.pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id) {
    await this.pool.execute('UPDATE users SET active = 0 WHERE id = ?', [id]);
    return { deleted: true };
  }

  async applyPenalty(userId, amount) {
    await this.pool.execute('UPDATE users SET salary = salary - ? WHERE id = ?', [amount, userId]);
    await this.pool.execute('INSERT INTO penalty_log (user_id, amount) VALUES (?, ?)', [userId, amount]);
    return { applied: true };
  }

  _toUser(row) {
    return new User({
      id: row.id,
      username: row.username,
      password: row.password,
      fullName: row.full_name,
      salary: row.salary,
      scheduleStart: row.schedule_start,
      scheduleEnd: row.schedule_end,
      role: row.role,
      active: row.active
    });
  }
}

module.exports = SQLiteUserRepository;