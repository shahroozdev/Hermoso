import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hermoso API Documentation',
      version: '1.0.0',
      description: 'Multi-tenant salon management platform API',
      contact: {
        name: 'API Support',
        email: 'support@hermoso.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/',
        description: 'Development server'
      },
      {
        url: 'https://hermoso-rx6j.vercel.app/',
        description: 'Staging server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Validation Error Response
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email format' }
                }
              }
            }
          }
        },

        // Auth schemas with Zod validation rules
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: {
              type: 'string',
              minLength: 8,
              pattern: '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])',
              description: 'Must contain uppercase, lowercase, and number',
              example: 'Password123'
            },
            role: { type: 'string', enum: ['customer', 'salon_owner'], example: 'customer' },
            phone: { type: 'string', example: '+92-300-1234567' },
            location: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                country: { type: 'string' }
              }
            }
          }
        },

        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 1, example: 'Password123' }
          }
        },

        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },

        // Service schemas with Zod validation
        CreateServiceRequest: {
          type: 'object',
          required: ['name', 'price', 'duration', 'categoryId'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Haircut & Style' },
            description: { type: 'string', maxLength: 500, example: 'Professional haircut with styling' },
            price: { type: 'number', minimum: 0, example: 50 },
            duration: { type: 'number', minimum: 5, example: 60 },
            categoryId: { type: 'string', example: '507f1f77bcf86cd799439011' }
          }
        },

        // Event schemas
        CreateEventRequest: {
          type: 'object',
          required: ['name', 'category', 'services'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Bridal Complete Package' },
            description: { type: 'string', maxLength: 500, example: 'Complete bridal makeup and styling' },
            category: {
              type: 'string',
              enum: ['bridal', 'party', 'eid', 'independence_day', 'birthday', 'engagement', 'anniversary', 'corporate', 'wedding', 'other'],
              example: 'bridal'
            },
            services: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  serviceId: { type: 'string', example: '507f1f77bcf86cd799439011' }
                }
              }
            },
            discount: { type: 'number', minimum: 0, maximum: 100, example: 10 },
            images: { type: 'array', items: { type: 'string' } }
          }
        },

        EventResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            salonId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  serviceId: { type: 'string' },
                  serviceName: { type: 'string' },
                  price: { type: 'number' },
                  duration: { type: 'number' }
                }
              }
            },
            totalPrice: { type: 'number' },
            totalDuration: { type: 'number' },
            discount: { type: 'number' },
            finalPrice: { type: 'number' },
            active: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        // Salon schemas
        CreateSalonRequest: {
          type: 'object',
          required: ['name', 'address', 'phone'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Luxe Hair Studio' },
            description: { type: 'string', maxLength: 1000, example: 'Premium hair and beauty salon' },
            address: { type: 'string', minLength: 5, example: 'Main Street, Karachi' },
            phone: { type: 'string', example: '+92-300-1234567' },
            images: { type: 'array', items: { type: 'string' } },
            commissionRate: { type: 'number', minimum: 0, maximum: 100, example: 10 },
            location: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                country: { type: 'string' }
              }
            }
          }
        },

        // Booking schemas
        CreateBookingRequest: {
          type: 'object',
          required: ['salonId', 'serviceId', 'staffId', 'bookingDate', 'bookingTime'],
          properties: {
            salonId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            serviceId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            staffId: { type: 'string', example: '507f1f77bcf86cd799439013' },
            bookingDate: { type: 'string', example: '2024-12-25' },
            bookingTime: { type: 'string', example: '14:00' }
          }
        },

        // Category schemas
        CreateCategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Hair' }
          }
        },

        // Review schemas
        CreateReviewRequest: {
          type: 'object',
          required: ['salonId', 'rating'],
          properties: {
            salonId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', maxLength: 1000, example: 'Great service!' }
          }
        },

        // Pagination
        PaginationParams: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 10 }
          }
        },

        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' }
              }
            }
          }
        },

        // Error response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' }
          }
        },

        // Common enums
        Role: {
          type: 'string',
          enum: ['super_admin', 'salon_owner', 'staff', 'customer']
        },

        BookingStatus: {
          type: 'string',
          enum: ['pending', 'confirmed', 'completed', 'cancelled']
        },

        SalonStatus: {
          type: 'string',
          enum: ['pending', 'approved', 'suspended']
        },

        ReviewStatus: {
          type: 'string',
          enum: ['pending', 'approved', 'flagged', 'deleted']
        },

        EventCategory: {
          type: 'string',
          enum: ['bridal', 'party', 'eid', 'independence_day', 'birthday', 'engagement', 'anniversary', 'corporate', 'wedding', 'other']
        },

        UserStatus: {
          type: 'string',
          enum: ['active', 'inactive', 'suspended']
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.ts', './controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
