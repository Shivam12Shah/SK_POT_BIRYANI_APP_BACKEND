const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Partner = require('../models/Partner');

/**
 * @swagger
 * tags:
 *   name: Order Management
 *   description: Order creation, management and assignment operations
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Order Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - items
 *             properties:
 *               customer:
 *                 type: object
 *                 required:
 *                   - name
 *                   - phone
 *                   - address
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Customer name
 *                   phone:
 *                     type: string
 *                     description: Customer phone number
 *                   address:
 *                     type: string
 *                     description: Customer delivery address
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - food
 *                     - title
 *                     - qty
 *                     - price
 *                   properties:
 *                     food:
 *                       type: string
 *                       description: Food item ID
 *                     title:
 *                       type: string
 *                       description: Food item title
 *                     qty:
 *                       type: number
 *                       description: Quantity ordered
 *                     price:
 *                       type: number
 *                       description: Unit price
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.post('/', auth, async (req, res) => {
  const { customer, items } = req.body;
  const total = items.reduce((s, it) => s + (it.price * it.qty), 0);
  const order = await Order.create({ customer, items, total });
  res.json(order);
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Order Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of orders with populated partner information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/', auth, async (req, res) => {
  const orders = await Order.find().populate('assignedTo').sort({ createdAt: -1 });
  res.json(orders);
});

/**
 * @swagger
 * /api/orders/{id}/accept:
 *   post:
 *     summary: Accept an order
 *     tags: [Order Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/accept', auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  order.status = 'accepted';
  await order.save();
  res.json(order);
});

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Order Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.post('/:id/cancel', auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.status = 'cancelled';
  await order.save();
  res.json(order);
});

/**
 * @swagger
 * /api/orders/{id}/assign:
 *   post:
 *     summary: Assign a partner to an order
 *     tags: [Order Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partnerId
 *             properties:
 *               partnerId:
 *                 type: string
 *                 description: Partner ID to assign
 *     responses:
 *       200:
 *         description: Partner assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Partner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/assign', auth, async (req, res) => {
  const { partnerId } = req.body;
  const partner = await Partner.findById(partnerId);
  if (!partner) return res.status(404).json({ message: 'Partner not found' });
  const order = await Order.findById(req.params.id);
  order.assignedTo = partner._id;
  await order.save();
  res.json(order);
});

module.exports = router;
