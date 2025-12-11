const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   phone: { type: string }
 *                   address: { type: string }
 *               paymentMethod: { type: string, default: 'COD' }
 *     responses:
 *       200:
 *         description: Order created
 */
router.post('/', auth, async (req, res) => {
    const { customer, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.food');
    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create order items snapshot
    const orderItems = cart.items.map(item => ({
        food: item.food._id,
        title: item.food.title,
        qty: item.quantity,
        price: item.price,
        total: item.total
    }));

    const order = await Order.create({
        user: req.user._id,
        customer,
        items: orderItems,
        total: cart.grandTotal,
        paymentMethod: paymentMethod || 'COD',
        paymentStatus: 'pending' // Default
    });

    // Clear cart
    cart.items = [];
    cart.grandTotal = 0;
    await cart.save();

    res.json(order);
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', auth, async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

/**
 * @swagger
 * /api/orders/track/{orderNumber}:
 *   get:
 *     summary: Track order by number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/track/:orderNumber', async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
        .populate('items.food')
        .populate('assignedTo', 'name phone'); // If assigned to driver

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
});

// --- ADMIN ROUTES ---

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 */
router.get('/admin/all', auth, async (req, res) => {
    // Check if admin
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('user', 'name phone');
    res.json(orders);
});

/**
 * @swagger
 * /api/orders/admin/{id}/status:
 *   patch:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Order updated
 */
router.patch('/admin/:id/status', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(order);
});

module.exports = router;
