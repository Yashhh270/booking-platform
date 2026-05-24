const Transport = require('../models/Transport');

exports.getTransports = async (req, res) => {
  try {
    const transports = await Transport.findAll();
    res.json({ transports });
  } catch (err) {
    console.error("Error fetching transports:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTransportByType = async (req, res) => {
  try {
    const type = req.params.type;
    const transports = await Transport.findByType(type);

    if (!transports.length) {
      return res.status(404).json({ error: 'No transports found for this type' });
    }

    res.json({ transports });
  } catch (err) {
    console.error("Error fetching transport by type:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getRoutes = async (req, res) => {
  try {
    const { source, destination, type } = req.query;
    
    if (!source || !destination || !type) {
      return res.status(400).json({ error: 'Source, destination and type are required' });
    }

    const route = await Transport.findRoute(source, destination, type);
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ route });
  } catch (err) {
    console.error("Error finding route:", err);
    res.status(500).json({ error: err.message });
  }
};