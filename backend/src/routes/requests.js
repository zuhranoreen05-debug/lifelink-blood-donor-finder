const express = require('express');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Requester = require('../models/Requester');
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

const RADIUS_KM = 50;

// Donors who can be asked for this request
function eligibleDonorQuery(bloodGroup, lng, lat) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return {
    isAvailable: true,
    $or: [{ lastDonationDate: null }, { lastDonationDate: { $lt: threeMonthsAgo } }],
    location: { $geoWithin: { $centerSphere: [[lng, lat], RADIUS_KM / 6378.1] } },
  };
}

// Create a new blood request (recipient must be logged in)
router.post('/', async (req, res) => {
  try {
    const { recipientId, bloodGroup, units, hospital, urgency, lat, lng } = req.body;

    const recipient = await Requester.findById(recipientId);
    if (!recipient) {
      return res.status(401).json({ message: 'Please log in as a recipient first' });
    }
    if (!bloodGroup || !units || !hospital || lat == null || lng == null) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!compatible[bloodGroup]) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    const request = await BloodRequest.create({
      requester: recipient._id,
      requesterName: recipient.name,
      requesterPhone: recipient.phone,
      bloodGroup,
      units,
      hospital,
      urgency,
      location: { type: 'Point', coordinates: [lng, lat] },
    });

    req.app.get('io').emit('requests-changed');
    res.status(201).json({ message: 'Request created', id: request._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Open requests near a donor, with the donor's own status on each
router.get('/for-donor/:donorId', async (req, res) => {
  try {
    const donor = await User.findById(req.params.donorId);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    const [lng, lat] = donor.location.coordinates;
    const requests = await BloodRequest.find({
      status: 'open',
      expiresAt: { $gt: new Date() },
      location: { $geoWithin: { $centerSphere: [[lng, lat], RADIUS_KM / 6378.1] } },
    }).sort({ createdAt: -1 });

    const result = requests
      
      .map((r) => {
        const mine = r.responses.find((x) => x.donor && x.donor.equals(donor._id));
        const myStatus = mine ? mine.status : 'pending';
        return {
          _id: r._id,
          requesterName: r.requesterName,
          requesterPhone: myStatus === 'accepted' ? r.requesterPhone : undefined,
          bloodGroup: r.bloodGroup,
          units: r.units,
          hospital: r.hospital,
          urgency: r.urgency,
          createdAt: r.createdAt,
          acceptedCount: r.responses.filter((x) => x.status === 'accepted').length,
          myStatus,
        };
      });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: 'Invalid donor id' });
  }
});

// Donor accepts or rejects a request (only once)
router.post('/:id/respond', async (req, res) => {
  try {
    const { donorId, status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid response' });
    }

    const donor = await User.findById(donorId);
    const request = await BloodRequest.findById(req.params.id);
    if (!donor || !request) return res.status(404).json({ message: 'Not found' });

    if (request.status !== 'open' || request.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This request is no longer open' });
    }
   
    if (request.responses.some((x) => x.donor && x.donor.equals(donor._id))) {
      return res.status(400).json({ message: 'You have already responded to this request' });
    }
    if (status === 'accepted' && !donor.isAvailable) {
      return res.status(400).json({ message: 'Turn your availability on first' });
    }

    request.responses.push({ donor: donor._id, status });
    await request.save();

    req.app.get('io').emit('requests-changed');
    res.json({
      status,
      requesterName: request.requesterName,
      requesterPhone: status === 'accepted' ? request.requesterPhone : undefined,
    });
  } catch (err) {
    res.status(400).json({ message: 'Invalid id' });
  }
});

// Status page for the recipient who created the request
router.get('/:id/status', async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate(
      'responses.donor',
      'name bloodGroup phone'
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (String(request.requester) !== String(req.query.recipientId)) {
      return res.status(403).json({ message: 'This is not your request' });
    }

    const responses = request.responses.filter((x) => x.donor);
    const respondedIds = responses.map((x) => x.donor._id);

    const [lng, lat] = request.location.coordinates;
    const pending = await User.find({
      ...eligibleDonorQuery(request.bloodGroup, lng, lat),
      _id: { $nin: respondedIds },
    }).select('name bloodGroup');

    const accepted = responses
      .filter((x) => x.status === 'accepted')
      .map((x) => ({
        _id: x.donor._id,
        name: x.donor.name,
        bloodGroup: x.donor.bloodGroup,
        phone: x.donor.phone,
      }));
    const rejected = responses
      .filter((x) => x.status === 'rejected')
      .map((x) => ({ _id: x.donor._id, name: x.donor.name, bloodGroup: x.donor.bloodGroup }));

    res.json({
      bloodGroup: request.bloodGroup,
      units: request.units,
      hospital: request.hospital,
      urgency: request.urgency,
      status: request.status === 'open' && request.expiresAt < new Date() ? 'expired' : request.status,
      createdAt: request.createdAt,
      notifiedCount: responses.length + pending.length,
      accepted,
      rejected,
      pending: pending.map((d) => ({ _id: d._id, name: d.name, bloodGroup: d.bloodGroup })),
    });
  } catch (err) {
    res.status(400).json({ message: 'Invalid request id' });
  }
});

module.exports = router;