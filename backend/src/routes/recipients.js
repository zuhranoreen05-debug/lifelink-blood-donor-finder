const express = require('express');
const Requester = require('../models/Requester');
const BloodRequest = require('../models/BloodRequest');
const router = express.Router();

// Create a recipient account
router.post('/register', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const phone = (req.body.phone || '').trim();
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });

    const recipient = await Requester.create({ name, phone });
    res.status(201).json({ id: recipient._id, name: recipient.name, phone: recipient.phone });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This number is already registered. Please log in.' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Log in with phone number
router.post('/login', async (req, res) => {
  try {
    const phone = (req.body.phone || '').trim();
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const recipient = await Requester.findOne({ phone });
    if (!recipient) {
      return res.status(404).json({ message: 'No account with this number. Please register first.' });
    }
    res.json({ id: recipient._id, name: recipient.name, phone: recipient.phone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// All requests created by this recipient
router.get('/:id/requests', async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requester: req.params.id })
      .sort({ createdAt: -1 })
      .populate('responses.donor', 'name bloodGroup');

    res.json(
      requests.map((r) => {
        const accepted = r.responses.filter((x) => x.status === 'accepted' && x.donor);
        const rejected = r.responses.filter((x) => x.status === 'rejected');
        return {
          _id: r._id,
          bloodGroup: r.bloodGroup,
          units: r.units,
          hospital: r.hospital,
          urgency: r.urgency,
          status: r.status === 'open' && r.expiresAt < new Date() ? 'expired' : r.status,
          createdAt: r.createdAt,
          acceptedNames: accepted.map((x) => x.donor.name),
          rejectedCount: rejected.length,
        };
      })
    );
  } catch (err) {
    res.status(400).json({ message: 'Invalid id' });
  }
});

// Mark a request as fulfilled
router.patch('/:id/requests/:requestId/fulfill', async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ _id: req.params.requestId, requester: req.params.id });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'fulfilled';
    await request.save();

    req.app.get('io').emit('requests-changed');
    res.json({ status: request.status });
  } catch (err) {
    res.status(400).json({ message: 'Invalid id' });
  }
});

module.exports = router;