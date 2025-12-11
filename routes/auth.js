const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const Otp = require('../models/Otp');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
// NOTE: In production hash OTPs and use an SMS provider (Twilio, etc.)
function generateOtp() {
  // Using dummy OTP for development/testing
  const dummyOtp = '123456';
  return dummyOtp;
}

router.post('/send-otp', upload.none(), async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone required' });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 5); // 5 min

  await Otp.create({ phone, code, expiresAt });

  // TODO: integrate SMS provider here (Twilio)
  console.log('DUMMY OTP for', phone, 'is:', code, '(Use this for testing)');

  return res.json({ message: 'Dummy OTP sent (check console for testing)' });
});

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login/register user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+1234567890"
 *               code:
 *                 type: string
 *                 description: OTP code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged in"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-otp', upload.none(), async (req, res) => {
  console.log("gfhjgfhfhgfhjgfghjfhgf", req.body);
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: 'phone and otp required' });

  const otpData = await Otp.findOne({ phone, code: otp });
  if (!otpData) return res.status(400).json({ message: 'Invalid or expired OTP' });

  // upsert user
  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ phone, isVerified: true });

  // create JWT cookie valid ~30 days
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production'
  });

  await Otp.deleteMany({ phone }); // cleanup
  res.json({ message: 'Logged in', token, user: { id: user._id, phone: user.phone } });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user by clearing authentication cookie
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out"
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
});

// Test/hello endpoint
router.get('/hello', async (req, res) => {
  try {
    res.json({ message: 'Hello from SK Pot Biryani API!', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Hello endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
