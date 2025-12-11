const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  code: { type: String, required: true }, // store hashed in prod
  expiresAt: { type: Date, required: true }
});
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete when expired
module.exports = mongoose.model('Otp', otpSchema);
