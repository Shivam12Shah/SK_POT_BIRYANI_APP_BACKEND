const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked User
  orderNumber: { type: String, unique: true }, // Friendly ID e.g. ORD-12345

  // Snapshot of customer details (in case they change later)
  customer: {
    name: String,
    phone: String,
    address: String
  },

  items: [{
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    title: String,
    qty: Number,
    price: Number,
    total: Number
  }],

  total: Number,

  paymentMethod: { type: String, default: 'COD' }, // 'COD', 'ONLINE'
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

  status: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null },
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate order number
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
