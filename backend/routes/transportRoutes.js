const express = require('express');
const transportController = require('../controllers/transportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, transportController.getTransports);
router.get('/:type', authMiddleware, transportController.getTransportByType);
router.get('/routes/search', authMiddleware, transportController.getRoutes);

module.exports = router;