const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true },
  vehicle: String,
  status: { type: String, enum: ['active','inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Partner', partnerSchema);
