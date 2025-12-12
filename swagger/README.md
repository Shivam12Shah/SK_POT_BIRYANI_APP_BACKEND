# SK Pot Biryani API Documentation

This folder contains the Swagger API documentation for the SK Pot Biryani backend application.

## Access Swagger UI

Once the server is running, you can access the interactive API documentation at:

**http://localhost:3000/api-docs**

## API Overview

The API includes the following main sections:

### Authentication (`/api/auth`)
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login/register user
- `POST /api/auth/logout` - Logout user

### Food Management (`/api/food`)
- `GET /api/food` - Get all food items (supports pagination: `?page=1&limit=20`)
- `POST /api/food` - Create new food item (supports images, dips, beverages, nutrition)
- `PUT /api/food/{id}` - Update food item
- `POST /api/food/{id}/stock-in` - Increase stock quantity
- `POST /api/food/{id}/stock-out` - Decrease stock quantity
- `DELETE /api/food/{id}` - Delete food item

### Cart Management (`/api/cart`)
- `GET /api/cart` - Get user's current cart
- `POST /api/cart/add` - Add item to cart or increment quantity
- `POST /api/cart/update-qty` - Set item quantity directly
- `POST /api/cart/remove` - Remove item from cart

### Order Management (`/api/orders`)
- `POST /api/orders` - Checkout (create order from cart)
- `GET /api/orders` - Get user's order history
- `GET /api/orders/track/{orderNumber}` - Track order by Order Number (e.g. ORD-12345)
- `GET /api/orders/admin/all` - Get all orders (Admin only)
- `PATCH /api/orders/admin/{id}/status` - Update order status (Admin only)

### Partner Management (`/api/partners`)
- `POST /api/partners` - Create new delivery partner
- `GET /api/partners` - Get all partners
- `PUT /api/partners/{id}` - Update partner
- `DELETE /api/partners/{id}` - Delete partner

## Authentication

Most endpoints require authentication using JWT tokens stored in HTTP-only cookies. The authentication flow:

1. Send OTP to phone number
2. Verify OTP to receive authentication cookie
3. Include cookie in subsequent requests

## File Uploads

Food items support image uploads (up to 6 images per item). Images are stored in the `uploads/` directory and served statically.

## Testing

Automated integration tests are implemented using Jest and Supertest.

### Running Tests
To run the full test suite:
```bash
npm test
```

### Test Coverage
- **Auth**: Registration, Login (OTP), Protected Routes.
- **Food**: CRUD operations, Pagination, Stock updates.
- **Cart**: Add, Update, Remove items, Totals calculation.
- **Orders**: Checkout flow, Order creation, Tracking.

Tests use separate MongoDB databases (e.g., `foodcms_test_auth`) to ensure data isolation. The `app.js` has been refactored to export the Express app without automatically listening, allowing Supertest to spin up ephemeral servers.
