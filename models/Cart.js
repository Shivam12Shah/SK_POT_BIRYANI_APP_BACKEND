const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    items: [{
        food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: { type: Number, default: 1 },
        price: Number, // Snapshot price at add time
        total: Number,
        // Selected add-ons (optional, one of each type)
        selectedAddons: {
            dip: {
                name: String,
                price: { type: Number, default: 0 }
            },
            beverage: {
                name: String,
                price: { type: Number, default: 0 }
            },
            drink: {
                name: String,
                price: { type: Number, default: 0 }
            }
        }
    }],
    grandTotal: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 100 },
    updatedAt: { type: Date, default: Date.now }
});

cartSchema.pre('save', function () {
    this.updatedAt = Date.now();

    // Calculate items total (including add-ons)
    const itemsTotal = this.items.reduce((acc, item) => {
        let itemTotal = item.total;
        // Add add-on prices
        if (item.selectedAddons) {
            if (item.selectedAddons.dip) itemTotal += (item.selectedAddons.dip.price || 0) * item.quantity;
            if (item.selectedAddons.beverage) itemTotal += (item.selectedAddons.beverage.price || 0) * item.quantity;
            if (item.selectedAddons.drink) itemTotal += (item.selectedAddons.drink.price || 0) * item.quantity;
        }
        return acc + itemTotal;
    }, 0);

    // Grand total = items total + delivery charges
    this.grandTotal = itemsTotal + (this.deliveryCharges || 0);
});

module.exports = mongoose.model('Cart', cartSchema);
