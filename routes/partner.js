const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Partner = require('../models/Partner');

/**
 * @swagger
 * tags:
 *   name: Partner Management
 *   description: Delivery partner CRUD operations
 */

/**
 * @swagger
 * /api/partners:
 *   post:
 *     summary: Create a new delivery partner
 *     tags: [Partner Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: Partner name
 *               phone:
 *                 type: string
 *                 description: Partner phone number
 *               vehicle:
 *                 type: string
 *                 description: Partner vehicle information
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Partner status
 *                 default: active
 *     responses:
 *       200:
 *         description: Partner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Partner'
 */
router.post('/', auth, async (req, res) => {
  const partner = await Partner.create(req.body);
  res.json(partner);
});

/**
 * @swagger
 * /api/partners:
 *   get:
 *     summary: Get all delivery partners
 *     tags: [Partner Management]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of partners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Partner'
 */
router.get('/', auth, async (req, res) => {
  const partners = await Partner.find().sort({ createdAt: -1 });
  res.json(partners);
});

/**
 * @swagger
 * /api/partners/{id}:
 *   put:
 *     summary: Update a delivery partner
 *     tags: [Partner Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Partner name
 *               phone:
 *                 type: string
 *                 description: Partner phone number
 *               vehicle:
 *                 type: string
 *                 description: Partner vehicle information
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Partner status
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Partner'
 */
router.put('/:id', auth, async (req, res) => {
  const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(partner);
});

/**
 * @swagger
 * /api/partners/{id}:
 *   delete:
 *     summary: Delete a delivery partner
 *     tags: [Partner Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Deleted"
 */
router.delete('/:id', auth, async (req, res) => {
  await Partner.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
