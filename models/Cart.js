const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    items: [{
        food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: { type: Number, default: 1 },
        price: Number, // Snapshot price at add time
        total: Number,
        // Future proofing for selected dips/drinks
        options: { type: mongoose.Schema.Types.Mixed, default: {} }
    }],
    grandTotal: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

cartSchema.pre('save', function () {
    this.updatedAt = Date.now();
    this.grandTotal = this.items.reduce((acc, item) => acc + item.total, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
