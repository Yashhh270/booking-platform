const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const Booking = require('../models/Booking');
const paymentsController = require('../controllers/paymentsController');
const authMiddleware = require('../middleware/authMiddleware');

// Booking routes
router.post('/create', authMiddleware, bookingController.createBooking);
router.get('/:id', authMiddleware, bookingController.getBooking);
router.post('/:id/pay', authMiddleware, paymentsController.processPayment);
router.get('/:id/ticket', authMiddleware, bookingController.getTicket);
// Add the PDF download route
router.get('/:id/ticket/pdf', authMiddleware, bookingController.downloadTicketPDF);
router.post('/:id/cancel', authMiddleware, bookingController.cancelBooking);
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.findByUserId(req.user.id);
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;