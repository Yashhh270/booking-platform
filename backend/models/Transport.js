const db = require('../config/db');

class Transport {
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM transports');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM transports WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByMode(mode) {
    const [rows] = await db.execute(
      'SELECT * FROM transports WHERE type = ? LIMIT 1',
      [mode]
    );
    return rows[0]; 
  }

  static async calculatePrice(transportId, distance) {
    const transport = await this.findById(transportId);
    if (!transport) {
      throw new Error('Transport not found');
    }
    return transport.base_price + (distance * transport.price_per_km);
  }
}

module.exports = Transport;