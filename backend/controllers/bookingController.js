const Booking = require('../models/Booking');
const Transport = require('../models/Transport');
const PDFDocument = require('pdfkit');

const errorResponse = (res, status, message, details = null) => {
  const response = { error: message };
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  return res.status(status).json(response);
};

// Create Booking
const createBooking = async (req, res) => {
  try {
    const { source, destination, date, transport_mode, seat } = req.body;
    const userId = req.user.id;
    const departure_time = req.body.departure_time || '12:00';
    // Validate all required fields
    if (!source || !destination || !date || !transport_mode || !seat) {
      return errorResponse(res, 400, 'All fields are required', {
        missingFields: {
          source: !source,
          destination: !destination,
          date: !date,
          transport_mode: !transport_mode,
          seat: !seat
        }
      });
    }

    // Find transport by mode
    const transport = await Transport.findByMode(transport_mode);
    if (!transport) {
      return errorResponse(res, 400, 'Transport not found for the specified mode', {
        availableModes: ['bus', 'train', 'metro']
      });
    }

    // Create booking
    const booking = await Booking.create({
      user_id: userId,
      transport_id: transport.id,
      source,
      destination,
      departure_time,
      date,
      transport_mode,
      seat,
      price: Number(transport.base_price)
    });

    if (!booking?.id) {
      throw new Error('Booking creation failed - no ID returned');
    }

    res.status(201).json({
      success: true,
      booking: {
        id: booking.id,
        price: booking.price,
        status: booking.status,
      
      },
      redirectUrl: `/payment.html?bookingId=${booking.id}`
    });

  } catch (err) {
    console.error("Booking creation error:", {
      message: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    errorResponse(res, 500, 'Booking failed', err.message);
  }
};


const getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Basic ID validation
    if (!id || isNaN(Number(id))) {
      return errorResponse(res, 400, 'Invalid booking ID format');
    }

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found', {
        bookingId: id
      });
    }
    
    // Verify ownership
    if (String(booking.user_id) !== String(req.user.id)) {
      return errorResponse(res, 403, 'Unauthorized access to booking');
    }
    if (!booking.id || !booking.price) {
      console.error('Incomplete booking data:', booking);
      return errorResponse(res, 500, 'Incomplete booking data');
    }

    res.status(200).json({
      success: true,
      booking: {
        id: booking.id,
        price: booking.price,
        source: booking.source,
        destination: booking.destination,
        date: booking.date,
        departure_time: booking.departure_time || '12:00',
        transport_mode: booking.transport_mode,
        seat: booking.seat,
        status: booking.status,
        payment_status: booking.payment_status
      }
    });
      
  } catch (err) {
    console.error("Booking retrieval error:", {
      message: err.message,
      stack: err.stack,
      params: req.params
    });
    errorResponse(res, 500, 'Failed to retrieve booking', err.message);
  }
};


const getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }
    
    if (String(booking.user_id) !== String(req.user.id)) {
      return errorResponse(res, 403, 'Unauthorized access to ticket');
    }
    if (!booking.id) {
      throw new Error('Invalid booking data - missing ID');
    }

    const ticket = {
      id: booking.id,
      ticketNumber: `MT-${booking.id.toString().padStart(6, '0')}`,
      price: booking.price,
      source: booking.source,
      destination: booking.destination,
      date: booking.date,
      transport_mode: booking.transport_mode,
      seat: booking.seat
    };
    
    res.status(200).json({
      success: true,
      ticket
    });
  } catch (err) {
    console.error("Ticket generation error:", err);
    errorResponse(res, 500, 'Failed to generate ticket', err.message);
  }
};

// Download Ticket PDF
const downloadTicketPDF = async (req, res) => {
  try {
 
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    const booking = await Booking.findByIdAndUserId(req.params.id, req.user.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const pdfBuffer = await generateTicketPDF(booking);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ticket-${req.params.id}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ 
      error: 'PDF generation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find the booking
    const booking = await Booking.findByIdAndUserId(id, userId);
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }
    const now = new Date();
    const bookingDate = new Date(booking.date);
    
    if (now > bookingDate) {
      return errorResponse(res, 400, 'Cannot cancel a past booking');
    }
    
    // Update 
    await Booking.updateStatus(id, 'cancelled');
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
    
  } catch (err) {
    console.error("Booking cancellation error:", err);
    errorResponse(res, 500, 'Failed to cancel booking', err.message);
  }
};



// Helper function for PDF generation
async function generateTicketPDF(booking) {
  const doc = new PDFDocument();
  const buffers = [];

  return new Promise((resolve, reject) => {
    doc.on('data', buffers.push.bind(buffers));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    try {
      // Add document content with error boundaries
      doc.fontSize(20).text('Metro Transport Connect', { align: 'center' });
      doc.moveDown();
      
      // Ticket number with fallback
      const ticketNumber = booking.id 
        ? `MT-${booking.id.toString().padStart(6, '0')}`
        : 'TICKET-NUMBER-NOT-AVAILABLE';
      
      doc.fontSize(16).text(`Ticket #: ${ticketNumber}`, { align: 'center' });
      doc.moveDown();

      // Route information with fallbacks
      doc.text(`From: ${booking.source || 'Not specified'}`);
      doc.text(`To: ${booking.destination || 'Not specified'}`);
      
      // Date with fallback
      const ticketDate = booking.date 
        ? new Date(booking.date).toLocaleDateString() 
        : 'Date not available';
      doc.text(`Date: ${ticketDate}`);

      // Departure time with fallback
      const departureTime = booking.departure_time || '--:--';
      doc.text(`Departure: ${departureTime}`);

      // Seat with fallback
      doc.text(`Seat: ${booking.seat || 'Not assigned'}`);

      // Price with fallback and formatting
      const price = booking.price 
        ? `$${Number(booking.price).toFixed(2)}` 
        : 'Price not available';
      doc.text(`Price: ${price}`);

      // Add QR code placeholder
      doc.moveDown();
      doc.text('Present this ticket at boarding', { align: 'center' });

    } catch (contentError) {
      console.error('PDF content error:', contentError);
      doc.text('Error generating ticket content');
    }

    doc.end();
  });
}
module.exports = {
  createBooking,
  getBooking,
  getTicket,
  downloadTicketPDF,
  cancelBooking
};