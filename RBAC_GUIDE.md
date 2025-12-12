# Role-Based Access Control Implementation

## Changes Made

### 1. Updated `routes/auth.js`
- Modified `/verify-otp` endpoint to accept `role` from frontend
- New users are created with the provided role (defaults to 'user')
- Existing users can have their role updated
- JWT token now includes the user's role
- Response includes the user's role

### 2. Created `middleware/checkRole.js`
A new middleware to restrict routes based on user roles.

## Usage Examples

### Protect Admin-Only Routes
```javascript
const auth = require('./middleware/auth');
const checkRole = require('./middleware/checkRole');

// Only admins can access
router.get('/admin/dashboard', auth, checkRole('admin'), async (req, res) => {
  // admin logic
});
```

### Protect Partner Routes
```javascript
// Only partners can access
router.get('/partner/orders', auth, checkRole('partner'), async (req, res) => {
  // partner logic
});
```

### Allow Multiple Roles
```javascript
// Both admin and partner can access
router.get('/orders/manage', auth, checkRole('admin', 'partner'), async (req, res) => {
  // shared logic
});
```

### User Routes (All Authenticated Users)
```javascript
// Any authenticated user can access
router.get('/profile', auth, async (req, res) => {
  // user profile logic
});
```

## Frontend Integration

When calling `/verify-otp`, send the role:
```javascript
{
  "phone": "1234567890",
  "otp": "123456",
  "role": "user"  // or "admin" or "partner"
}
```

Response will include:
```javascript
{
  "message": "Logged in",
  "token": "...",
  "user": {
    "id": "...",
    "phone": "...",
    "role": "user"
  }
}
```

## Role Hierarchy
- **user**: Regular customers (default)
- **partner**: Delivery partners
- **admin**: Full system access
