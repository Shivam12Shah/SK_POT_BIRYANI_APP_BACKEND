const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SK Pot Biryani API',
    version: '1.0.0',
    description: 'API documentation for SK Pot Biryani food ordering system',
    contact: {
      name: 'SK Pot Biryani Team',
      email: 'support@skpotbiryani.com'
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.skpotbiryani.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT token stored in HTTP-only cookie'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'User ID' },
          phone: { type: 'string', description: 'User phone number' },
          name: { type: 'string', description: 'User name' },
          role: { type: 'string', enum: ['admin', 'seller'], description: 'User role' },
          isVerified: { type: 'boolean', description: 'Verification status' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Food: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Food ID' },
          title: { type: 'string', description: 'Food title' },
          description: { type: 'string', description: 'Food description' },
          images: { type: 'array', items: { type: 'string' }, description: 'Food images URLs' },
          price: { type: 'number', description: 'Food price' },
          discount: { type: 'number', description: 'Discount percentage' },
          inStock: { type: 'boolean', description: 'Stock availability' },
          stockQty: { type: 'number', description: 'Stock quantity' },
          createdBy: { type: 'string', description: 'Creator user ID' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Order ID' },
          customer: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Customer name' },
              phone: { type: 'string', description: 'Customer phone' },
              address: { type: 'string', description: 'Customer address' }
            }
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                food: { type: 'string', description: 'Food ID' },
                title: { type: 'string', description: 'Food title' },
                qty: { type: 'number', description: 'Quantity' },
                price: { type: 'number', description: 'Unit price' }
              }
            }
          },
          total: { type: 'number', description: 'Order total' },
          status: { type: 'string', enum: ['placed', 'accepted', 'cancelled', 'delivered'], description: 'Order status' },
          assignedTo: { type: 'string', description: 'Assigned partner ID' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Partner: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Partner ID' },
          name: { type: 'string', description: 'Partner name' },
          phone: { type: 'string', description: 'Partner phone number' },
          vehicle: { type: 'string', description: 'Partner vehicle' },
          status: { type: 'string', enum: ['active', 'inactive'], description: 'Partner status' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Error message' }
        }
      }
    }
  },
  security: [{
    cookieAuth: []
  }]
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API routes
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
