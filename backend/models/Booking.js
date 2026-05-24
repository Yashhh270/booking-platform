const db = require('../config/db');

class Booking {
  static async create(bookingData) {
    const params = {
      user_id: bookingData.user_id ?? null,
      transport_id: bookingData.transport_id ?? null,
      source: bookingData.source ?? null,
      destination: bookingData.destination ?? null,
      distance_km: bookingData.distance_km ?? null,
      date: bookingData.date ?? null,
      departure_time: bookingData.departure_time ?? null,
      transport_mode: bookingData.transport_mode ?? null,
      seat: bookingData.seat ?? null,
      price: Number(bookingData.price) || 0,
      status: bookingData.status ?? 'pending',
      payment_status: bookingData.payment_status ?? 'unpaid'
    };

    console.log('Booking parameters:', params); // Debug log

    try {
      const [result] = await db.execute(
        `INSERT INTO bookings 
         (user_id, transport_id, source, destination, distance_km, date, 
          departure_time, transport_mode, seat, price, status, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          params.user_id,
          params.transport_id,
          params.source,
          params.destination,
          params.distance_km,
          params.date,
          params.departure_time,
          params.transport_mode,
          params.seat,
          params.price,
          params.status,
          params.payment_status
        ]
      );

      return { id: result.insertId, ...params };
    } catch (err) {
      console.error('Database error in Booking.create:', err);
      throw new Error('Failed to create booking: ' + err.message);
    }
  }

  static async findByUserId(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT b.*, t.name as transport_name 
         FROM bookings b
         JOIN transports t ON b.transport_id = t.id
         WHERE b.user_id = ?
         ORDER BY b.date DESC, b.departure_time DESC`,
        [userId]
      );
      return { success: true, bookings: rows };
    } catch (err) {
      console.error('Error in findByUserId:', err);
      throw err;
    }
  }
  

  
  static async findByIdAndUserId(id, userId) {
    try {
      const [rows] = await db.execute(
        `SELECT b.*, t.name as transport_name, t.type as transport_type,
         COALESCE(b.departure_time, '12:00') as departure_time
         FROM bookings b
         JOIN transports t ON b.transport_id = t.id
         WHERE b.id = ? AND b.user_id = ?`,
        [id, userId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (err) {
      console.error('Error in findByIdAndUserId:', err);
      throw err;
    }
  }
  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT b.*, 
       COALESCE(b.departure_time, '12:00') as departure_time,
       t.name as transport_name, 
       t.type as transport_type, 
       t.features as transport_features
       FROM bookings b
       JOIN transports t ON b.transport_id = t.id
       WHERE b.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async updateStatus(id, status) {
    await db.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );
  }
}

module.exports = Booking;