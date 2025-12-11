const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Food = require('../models/Food');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

/**
 * @swagger
 * tags:
 *   name: Food Management
 *   description: Food items CRUD operations and stock management
 */

// Simple multer disk storage (for demo). In prod, upload to S3/Cloudinary.
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage });

/**
 * @swagger
 * /api/food:
 *   get:
 *     summary: Get all food items
 *     tags: [Food Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of food items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Food'
 */
router.get('/', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const foods = await Food.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json(foods);
});

/**
 * @swagger
 * /api/food:
 *   post:
 *     summary: Create a new food item
 *     tags: [Food Management]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 description: Food title
 *               description:
 *                 type: string
 *                 description: Food description
 *               price:
 *                 type: number
 *                 description: Food price
 *               discount:
 *                 type: number
 *                 description: Discount percentage
 *                 default: 0
 *               stockQty:
 *                 type: number
 *                 description: Stock quantity
 *                 default: 0
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Food images (up to 6 files)
 *     responses:
 *       200:
 *         description: Food item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Food'
 */
router.post('/', auth, upload.array('images', 6), async (req, res) => {
  const { title, description, price, discount, stockQty } = req.body;
  const images = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`); // serve static
  const food = await Food.create({
    title, description,
    images, price: Number(price), discount: Number(discount || 0),
    stockQty: Number(stockQty || 0),
    inStock: Number(stockQty || 0) > 0,
    createdBy: req.user._id
  });
  res.json(food);
});

/**
 * @swagger
 * /api/food/{id}:
 *   put:
 *     summary: Update a food item
 *     tags: [Food Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food item ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Food title
 *               description:
 *                 type: string
 *                 description: Food description
 *               price:
 *                 type: number
 *                 description: Food price
 *               discount:
 *                 type: number
 *                 description: Discount percentage
 *               stockQty:
 *                 type: number
 *                 description: Stock quantity
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Food images (up to 6 files)
 *     responses:
 *       200:
 *         description: Food item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Food'
 */
router.put('/:id', auth, upload.array('images', 6), async (req, res) => {
  const { id } = req.params;
  const update = { ...req.body };
  if (req.files && req.files.length) {
    update.images = (req.files).map(f => `/uploads/${path.basename(f.path)}`);
  }
  if (update.stockQty !== undefined) {
    update.inStock = Number(update.stockQty) > 0;
    update.stockQty = Number(update.stockQty);
  }
  const food = await Food.findByIdAndUpdate(id, update, { new: true });
  res.json(food);
});

/**
 * @swagger
 * /api/food/{id}/stock-in:
 *   post:
 *     summary: Increase stock quantity for a food item
 *     tags: [Food Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food item ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qty:
 *                 type: number
 *                 description: Quantity to add
 *                 default: 1
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Food'
 */
router.post('/:id/stock-in', auth, async (req, res) => {
  const { qty } = req.body;
  const food = await Food.findById(req.params.id);
  food.stockQty += Number(qty || 1);
  food.inStock = food.stockQty > 0;
  await food.save();
  res.json(food);
});

/**
 * @swagger
 * /api/food/{id}/stock-out:
 *   post:
 *     summary: Decrease stock quantity for a food item
 *     tags: [Food Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food item ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qty:
 *                 type: number
 *                 description: Quantity to subtract
 *                 default: 1
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Food'
 */
router.post('/:id/stock-out', auth, async (req, res) => {
  const { qty } = req.body;
  const food = await Food.findById(req.params.id);
  food.stockQty = Math.max(0, food.stockQty - Number(qty || 1));
  food.inStock = food.stockQty > 0;
  await food.save();
  res.json(food);
});

/**
 * @swagger
 * /api/food/{id}:
 *   delete:
 *     summary: Delete a food item
 *     tags: [Food Management]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food item ID
 *     responses:
 *       200:
 *         description: Food item deleted successfully
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
  await Food.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
