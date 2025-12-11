const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const TEST_MONGO_URI = 'mongodb://localhost:27017/foodcms_test_food';

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_MONGO_URI);
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe('Food API', () => {
    let cookie;
    let foodId;

    // Login helper
    beforeAll(async () => {
        const phone = '9999999999';
        await request(app).post('/api/auth/send-otp').send({ phone });
        const res = await request(app)
            .post('/api/auth/verify-otp')
            .send({ phone, code: '123456' });
        cookie = res.headers['set-cookie'];
    });

    // 1. Create Food (Positive)
    it('should create a new food item', async () => {
        const res = await request(app)
            .post('/api/food')
            .set('Cookie', cookie)
            .field('title', 'Chicken Biryani')
            .field('description', 'Delicious')
            .field('price', 250)
            .field('stockQty', 10);
        // NOTE: Images are tricky with supertest field/attach, 
        // but the route handles req.files optional? 
        // Based on code: const images = (req.files || [])...
        // So we can skip attaching files for basic test.

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('title', 'Chicken Biryani');
        expect(res.body.inStock).toBe(true);
        foodId = res.body._id;
    });

    // 2. Get Foods (Pagination)
    it('should get food list with pagination', async () => {
        const res = await request(app)
            .get('/api/food?page=1&limit=5')
            .set('Cookie', cookie);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    // 3. Update Food
    it('should update food details', async () => {
        const res = await request(app)
            .put(`/api/food/${foodId}`)
            .set('Cookie', cookie)
            .send({ price: 300 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.price).toBe(300);
    });

    // 4. Stock Management
    it('should decrease stock', async () => {
        const res = await request(app)
            .post(`/api/food/${foodId}/stock-out`)
            .set('Cookie', cookie)
            .send({ qty: 2 });

        expect(res.statusCode).toEqual(200);
        // Initial was 10, now should be 8
        expect(res.body.stockQty).toBe(8);
    });

    // 5. Delete Food
    it('should delete food item', async () => {
        const res = await request(app)
            .delete(`/api/food/${foodId}`)
            .set('Cookie', cookie);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Deleted');
    });
});
