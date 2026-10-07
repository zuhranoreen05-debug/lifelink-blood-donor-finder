const express = require('express');
const User = require('../models/User');
const router = express.Router();

const compatible = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

// Register a new donor
router.post('/register', async (req, res) => {
  try {
    const { name, phone, bloodGroup, lat, lng, lastDonationDate } = req.body;

    if (!name || !phone || !bloodGroup || lat == null || lng == null) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const donor = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      bloodGroup,
      lastDonationDate: lastDonationDate || null,
      location: { type: 'Point', coordinates: [lng, lat] },
    });

    res.status(201).json({ message: 'Donor registered', id: donor._id });
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

    const donor = await User.findOne({ phone });
    if (!donor) {
      return res.status(404).json({ message: 'No donor found with this number. Please register first.' });
    }

    res.json({
      id: donor._id,
      name: donor.name,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      isAvailable: donor.isAvailable,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Turn availability on or off
router.patch('/:id/availability', async (req, res) => {
  try {
    const donor = await User.findByIdAndUpdate(
      req.params.id,
      { isAvailable: !!req.body.isAvailable },
      { new: true }
    );
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json({ isAvailable: donor.isAvailable });
  } catch (err) {
    res.status(400).json({ message: 'Invalid donor id' });
  }
});

// Nearby donors (used by the Find Donors map page)
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, group, radius = 10 } = req.query;

    if (!lat || !lng || !group) {
      return res.status(400).json({ message: 'lat, lng and group are required' });
    }
    if (!compatible[group]) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const donors = await User.find({
      bloodGroup: { $in: compatible[group] },
      isAvailable: true,
      $or: [{ lastDonationDate: null }, { lastDonationDate: { $lt: threeMonthsAgo } }],
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000,
        },
      },
    }).select('-phone');

    res.json({ count: donors.length, donors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;