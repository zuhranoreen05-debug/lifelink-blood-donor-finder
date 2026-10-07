const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'Requester' },
  requesterName: { type: String, required: true },
  requesterPhone: { type: String, required: true },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  units: { type: Number, required: true, min: 1, max: 10 },
  hospital: { type: String, required: true },
  urgency: { type: String, enum: ['normal', 'urgent', 'critical'], default: 'urgent' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  status: { type: String, enum: ['open', 'fulfilled', 'expired'], default: 'open' },
  responses: [
    {
      donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['accepted', 'rejected'] },
      respondedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) },
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);