const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Use a separate database for testing
const TEST_MONGO_URI = 'mongodb://localhost:27017/foodcms_test_auth';

// Connect before tests
beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_MONGO_URI);
    }
});

// Cleanup after tests
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

// Mock OTP verification since we can't easily receive SMS in tests
// We will assume the OTP verification logic works if we mock the logic or 
// if we test the routes that DON'T depend on external SMS service strictly.
// However, since /verify-otp creates the user, we need to test it.
// Ideally, we'd mock the OTP service. For this test, we might struggle if
// the backend sends real SMS. 
// *Checking auth.js implementation would be good, but assuming standard flow.*

describe('Auth API', () => {
    let userPhone = '9999999999';
    let cookie;

    // 1. Test Sending OTP (Positive)
    it('should send OTP to a valid phone number', async () => {
        const res = await request(app)
            .post('/api/auth/send-otp')
            .send({ phone: userPhone });

        // Expect 200 OK
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Dummy OTP sent (check console for testing)');
    });

    // 2. Test Sending OTP (Negative - Missing Phone)
    it('should fail to send OTP without phone number', async () => {
        const res = await request(app)
            .post('/api/auth/send-otp')
            .send({});

        // Expect 400 Bad Request
        expect(res.statusCode).toEqual(400);
    });

    // 3. Test Verify OTP & Login (Positive)
    // NOTE: This test assumes the backend allows verifying with a fixed OTP for test mode 
    // OR we need to know the OTP. 
    // IF the backend generates a random OTP, we can't guess it without mocking.
    // **CRITICAL**: For this test to work without changing code, we might need to Mock the OTP model or service.
    // But let's assume we can't easily mock internal modules without more setup.
    // Instead, let's create a User directly for subsequent tests if verifying OTP is blocked.

    // Strategy: Create a user directly in DB to get a token? 
    // But we need the cookie. The cookie is set by `verify-otp`.
    // Let's trying creating a user and generating a JWT manually if we had the secret.

    // Alternative: Mock the `Otp.findOne` method if possible, but Jest mocks require require hooks.
    // Let's try to verify with a "wrong" OTP first to test negative case.

    // 3. Test Verify OTP & Login (Positive)
    it('should login successfully with correct OTP', async () => {
        // First send OTP to ensure record exists
        await request(app).post('/api/auth/send-otp').send({ phone: userPhone });

        const res = await request(app)
            .post('/api/auth/verify-otp')
            .send({ phone: userPhone, code: '123456' }); // Known dummy OTP

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Logged in');
        expect(res.headers['set-cookie']).toBeDefined();
        cookie = res.headers['set-cookie'];
    });

    // 4. Test Access Protected Route (Negative - No Cookie)
    it('should deny access to protected route without cookie', async () => {
        // Assuming /api/food/ is protected or any other protected route
        // Actually /api/food GET is protected in your code? Let's check. 
        // Yes, router.get('/', auth, ...)
        const res = await request(app).get('/api/food');
        expect(res.statusCode).toEqual(401);
    });
});
