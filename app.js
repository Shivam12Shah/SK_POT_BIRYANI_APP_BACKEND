// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const { swaggerUi, swaggerSpec } = require('./swagger/swagger');

const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const orderRoutes = require('./routes/orders'); // Using new orders.js
const cartRoutes = require('./routes/cart');
const partnerRoutes = require('./routes/partner');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/partners', partnerRoutes);

const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/foodcms';

// Export app for testing
module.exports = app;

// Only start server if run directly
if (require.main === module) {
  mongoose.connect(MONGO)
    .then(() => app.listen(PORT, () => console.log('Server running on', PORT)))
    .catch(err => console.error(err));
}
