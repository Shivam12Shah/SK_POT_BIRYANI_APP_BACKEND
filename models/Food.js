const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String, // Primary Image
  images: [String], // Additional images
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // percentage
  inStock: { type: Boolean, default: true },
  stockQty: { type: Number, default: 0 },

  // Complex Data
  dips: [{
    name: String,
    price: Number
  }],
  beverages: [{
    name: String,
    price: Number
  }],
  drinks: [{
    name: String,
    price: Number
  }],
  nutrition: {
    calories: Number,
    proteins: Number,
    fats: Number,
    carbs: Number,
    sugar: Number
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Food', foodSchema);
