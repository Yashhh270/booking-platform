// Create a new paymentsController.js
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

exports.processPayment = async (req, res) => {
  try {
    const { bookingId, method, amount, currency, card } = req.body;
    const userId = req.user.id;

  
    if (!bookingId || !method || !amount || !currency) {
      return res.status(400).json({ error: 'Missing payment details' });
    }
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      return res.status(400).json({ error: 'Invalid amount format' });
    }
    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking || String(booking.user_id) !== String(userId)) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Process payment 
    const payment = await Payment.create({
      booking_id: bookingId,
      user_id: userId,
      amount,
      currency,
      payment_method: method,
      status: 'completed'
    
    });

    // Update 
    await Booking.updateStatus(bookingId, 'paid');

    res.setHeader('Content-Type', 'application/json');

    res.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: `/confirmation.html?bookingId=${bookingId}&paymentId=${payment.id}`
    });
  } catch (err) {
    console.error("Payment processing error:", err);
    res.status(500).json({ 
      error: 'Payment failed',
      details: err.message 
    });
  }
};