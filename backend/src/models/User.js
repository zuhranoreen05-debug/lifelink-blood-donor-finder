const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  isAvailable: { type: Boolean, default: true },
  lastDonationDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);