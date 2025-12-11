const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Food = require('../models/Food');

const TEST_MONGO_URI = 'mongodb://localhost:27017/foodcms_test_orders';

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_MONGO_URI);
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe('Order API', () => {
    let cookie;
    let foodId;
    let orderNumber;

    beforeAll(async () => {
        // Login
        const phone = '7777777777';
        await request(app).post('/api/auth/send-otp').send({ phone });
        const authRes = await request(app)
            .post('/api/auth/verify-otp')
            .send({ phone, code: '123456' });
        cookie = authRes.headers['set-cookie'];

        // Create Food
        const food = await Food.create({
            title: 'Order Item',
            price: 200,
            stockQty: 50,
            inStock: true
        });
        foodId = food._id.toString();
    });

    // 1. Checkout (Empty Cart) - Negative
    it('should fail checkout with empty cart', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', cookie)
            .send({ customer: { name: 'Test', phone: '123', address: 'Home' } });

        expect(res.statusCode).toBeGreaterThanOrEqual(400); // 400 or 404
    });

    // 2. Checkout (Success)
    it('should create order successfully', async () => {
        // Add to cart first
        await request(app)
            .post('/api/cart/add')
            .set('Cookie', cookie)
            .send({ foodId, qty: 1 });

        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', cookie)
            .send({
                customer: { name: 'Test User', phone: '999', address: '123 Street' },
                paymentMethod: 'COD'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('orderNumber');
        expect(res.body.status).toBe('placed');
        orderNumber = res.body.orderNumber;
    });

    // 3. Track Order
    it('should track order details', async () => {
        const res = await request(app)
            .get(`/api/orders/track/${orderNumber}`)
            .set('Cookie', cookie);

        expect(res.statusCode).toEqual(200);
        expect(res.body.orderNumber).toBe(orderNumber);
    });
});
