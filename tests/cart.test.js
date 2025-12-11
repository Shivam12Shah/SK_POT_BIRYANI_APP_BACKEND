const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Food = require('../models/Food');

const TEST_MONGO_URI = 'mongodb://localhost:27017/foodcms_test_cart';

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_MONGO_URI);
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe('Cart API', () => {
    let cookie;
    let foodId;

    beforeAll(async () => {
        // Login
        const phone = '8888888888';
        await request(app).post('/api/auth/send-otp').send({ phone });
        const authRes = await request(app)
            .post('/api/auth/verify-otp')
            .send({ phone, otp: '123456' });
        cookie = authRes.headers['set-cookie'];

        // Create a food item strictly for adding to cart
        // We need to bypass the route and use Model directly or use another user?
        // Using Model directly is cleaner for setup.
        const food = await Food.create({
            title: 'Cart Item',
            price: 100,
            stockQty: 50,
            inStock: true
        });
        foodId = food._id.toString();
    });

    // 1. Add to Cart
    it('should add item to cart', async () => {
        const res = await request(app)
            .post('/api/cart/add')
            .set('Cookie', cookie)
            .send({ foodId, qty: 2 });

        if (res.statusCode !== 200) {
            console.error('Cart Add Error:', JSON.stringify(res.body, null, 2));
        }
        expect(res.statusCode).toEqual(200);
        expect(res.body.items.length).toBe(1);
        expect(res.body.items[0].quantity).toBe(2);
        expect(res.body.grandTotal).toBe(200);
    });

    // 2. Update Qty
    it('should update item quantity', async () => {
        const res = await request(app)
            .post('/api/cart/update-qty')
            .set('Cookie', cookie)
            .send({ foodId, qty: 5 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.items[0].quantity).toBe(5);
        expect(res.body.grandTotal).toBe(500);
    });

    // 3. Remove Item
    it('should remove item from cart', async () => {
        const res = await request(app)
            .post('/api/cart/remove')
            .set('Cookie', cookie)
            .send({ foodId });

        expect(res.statusCode).toEqual(200);
        expect(res.body.items.length).toBe(0);
        expect(res.body.grandTotal).toBe(0);
    });
});
