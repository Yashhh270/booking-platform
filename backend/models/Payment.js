const db = require('../config/db');

class Payment {
  static async create({ booking_id, amount, currency, payment_method, status }) {
    const [result] = await db.execute(
      `INSERT INTO payments 
       (booking_id, amount, currency, payment_method, status)
       VALUES (?, ?, ?, ?, ?)`,
      [booking_id, amount, currency, payment_method, status]
    );
    return { id: result.insertId };
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );
    return rows[0];
  }
}

module.exports = Payment;