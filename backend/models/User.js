const db = require('../config/db');

class User {
  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async create({ name, email, password }) {
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    return { id: result.insertId, name, email };
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    return rows[0];
  }
}

module.exports = User;