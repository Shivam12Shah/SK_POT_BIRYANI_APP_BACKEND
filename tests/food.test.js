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
            .send({ phone, otp: '123456' });
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

    // 4. Test Stock Update (In/Out) - Increase
    it('should increase stock', async () => {
        const res = await request(app)
            .post(`/api/food/${foodId}/stock-in`)
            .set('Cookie', cookie)
            .send({ qty: 5 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.stockQty).toBe(15); // 10 (initial) + 5 (increase)
    });

    // 5. Test Stock Update (In/Out) - Decrease
    it('should decrease stock', async () => {
        const res = await request(app)
            .post(`/api/food/${foodId}/stock-out`)
            .set('Cookie', cookie)
            .send({ qty: 2 });

        expect(res.statusCode).toEqual(200);
        // Initial was 10, increased by 5 (15), now decreased by 2 (13)
        expect(res.body.stockQty).toBe(13);
    });

    // 6. Test PATCH status endpoint
    it('should update food status and stock', async () => {
        const res = await request(app)
            .patch(`/api/food/${foodId}/status`)
            .set('Cookie', cookie)
            .send({ inStock: false, stockQty: 0 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.inStock).toBe(false);
        expect(res.body.stockQty).toBe(0);

        // Re-enable
        const res2 = await request(app)
            .patch(`/api/food/${foodId}/status`)
            .set('Cookie', cookie)
            .send({ inStock: true, stockQty: 100 });

        expect(res2.statusCode).toEqual(200);
        expect(res2.body.inStock).toBe(true);
        expect(res2.body.stockQty).toBe(100);
    });

    // 7. Delete Food
    it('should delete food item', async () => {
        const res = await request(app)
            .delete(`/api/food/${foodId}`)
            .set('Cookie', cookie);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Deleted');
    });
});
