const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Food = require('../models/Food');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping Cart operations
 */

// Helper to get cart or create new one
const getCart = async (userId) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.food');
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
};

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user cart
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User cart
 */
router.get('/', auth, async (req, res) => {
    const cart = await getCart(req.user._id);
    res.json(cart);
});

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foodId:
 *                 type: string
 *               qty:
 *                 type: number
 *                 default: 1
 *     responses:
 *       200:
 *         description: Cart updated
 */
router.post('/add', auth, async (req, res) => {
    const { foodId, qty = 1 } = req.body;
    const quantity = parseInt(qty);

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: 'Food not found' });

    let cart = await getCart(req.user._id);
    const itemIndex = cart.items.findIndex(item => item.food._id.toString() === foodId);

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].total = cart.items[itemIndex].quantity * cart.items[itemIndex].price;
    } else {
        cart.items.push({
            food: food._id,
            quantity,
            price: food.price,
            total: food.price * quantity
        });
    }

    await cart.save();
    // Refetch to populate
    cart = await Cart.findById(cart._id).populate('items.food');
    res.json(cart);
});

/**
 * @swagger
 * /api/cart/update-qty:
 *   post:
 *     summary: Update item quantity
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foodId:
 *                 type: string
 *               qty:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart updated
 */
router.post('/update-qty', auth, async (req, res) => {
    const { foodId, qty } = req.body;
    const quantity = parseInt(qty);

    if (quantity < 1) return res.status(400).json({ message: 'Qty must be at least 1, use remove to delete' });

    let cart = await getCart(req.user._id);
    const itemIndex = cart.items.findIndex(item => item.food._id.toString() === foodId);

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].total = quantity * cart.items[itemIndex].price;
        await cart.save();
    }

    cart = await Cart.findById(cart._id).populate('items.food');
    res.json(cart);
});

/**
 * @swagger
 * /api/cart/remove:
 *   post:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               foodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cart updated
 */
router.post('/remove', auth, async (req, res) => {
    const { foodId } = req.body;
    let cart = await getCart(req.user._id);

    cart.items = cart.items.filter(item => item.food._id.toString() !== foodId);
    await cart.save();

    cart = await Cart.findById(cart._id).populate('items.food');
    res.json(cart);
});

module.exports = router;
