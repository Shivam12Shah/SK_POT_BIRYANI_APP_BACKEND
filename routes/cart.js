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
    let cart = await Cart.findOne({ user: userId }).populate('items.food', '_id title price images');
    console.log("cart items:", JSON.stringify(cart, null, 2));
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
    console.log("gfhjgfhfhgfhjgfghjfhgf", req.user);
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
    try {
        console.log("gfhjgfhfhgfhjgfghjfhgf", req.body);
        const { foodId, qty, selectedAddons } = req.body;
        const quantity = parseInt(qty);

        const food = await Food.findById(foodId);
        if (!food) return res.status(404).json({ message: 'Food not found' });

        let cart = await getCart(req.user._id);
        const itemIndex = cart.items.findIndex(item => item.food._id.toString() === foodId);

        if (itemIndex > -1) {
            // Update existing item
            cart.items[itemIndex].quantity += quantity;
            cart.items[itemIndex].total = cart.items[itemIndex].quantity * cart.items[itemIndex].price;

            // Update add-ons if provided
            if (selectedAddons) {
                cart.items[itemIndex].selectedAddons = {
                    dip: selectedAddons.dip || cart.items[itemIndex].selectedAddons?.dip,
                    beverage: selectedAddons.beverage || cart.items[itemIndex].selectedAddons?.beverage,
                    drink: selectedAddons.drink || cart.items[itemIndex].selectedAddons?.drink
                };
            }
        } else {
            // Add new item
            cart.items.push({
                food: food._id,
                quantity,
                price: food.price,
                total: food.price * quantity,
                selectedAddons: selectedAddons || {}
            });
        }

        await cart.save();
        // Refetch to populate
        cart = await Cart.findById(cart._id).populate('items.food');
        res.json(cart);
    } catch (error) {
        console.error('Cart Add Error:', error);
        res.status(500).json({ message: error.message });
    }
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
    try {
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
    } catch (error) {
        console.error('Update Qty Error:', error);
        res.status(500).json({ message: error.message });
    }
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
    try {
        const { foodId } = req.body;
        let cart = await getCart(req.user._id);

        cart.items = cart.items.filter(item => item.food._id.toString() !== foodId);
        await cart.save();

        cart = await Cart.findById(cart._id).populate('items.food');
        res.json(cart);
    } catch (error) {
        console.error('Cart Remove Error:', error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/cart/update-addons:
 *   post:
 *     summary: Update or remove add-ons for a cart item
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foodId
 *             properties:
 *               foodId:
 *                 type: string
 *               selectedAddons:
 *                 type: object
 *                 properties:
 *                   dip:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                   beverage:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                   drink:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *     responses:
 *       200:
 *         description: Add-ons updated
 */
router.post('/update-addons', auth, async (req, res) => {
    try {
        const { foodId, selectedAddons } = req.body;

        if (!foodId) {
            return res.status(400).json({ message: 'foodId is required' });
        }

        let cart = await getCart(req.user._id);
        const itemIndex = cart.items.findIndex(item => item.food._id.toString() === foodId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Update add-ons - if null/undefined is passed, it removes that add-on
        cart.items[itemIndex].selectedAddons = {
            dip: selectedAddons?.dip || undefined,
            beverage: selectedAddons?.beverage || undefined,
            drink: selectedAddons?.drink || undefined
        };

        await cart.save();
        cart = await Cart.findById(cart._id).populate('items.food');
        res.json(cart);
    } catch (error) {
        console.error('Update Add-ons Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
