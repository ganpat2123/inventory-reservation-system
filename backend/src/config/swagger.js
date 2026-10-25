const path = require("path"); 
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Inventory Reservation System API",
      version: "1.0.0",
      description:
        "REST API for product inventory, stock reservations, confirmation, release, expiry and idempotency."
    },

    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server"
      }
    ],

    components: {
      securitySchemes: {
        IdempotencyKey: {
          type: "apiKey",
          in: "header",
          name: "Idempotency-Key",
          description: "Unique key for each new reservation attempt."
        }
      },

      schemas: {
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            sku: { type: "string" },
            total_quantity: { type: "integer" },
            available_quantity: { type: "integer" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" }
          }
        },

        Reservation: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            product_id: { type: "string", format: "uuid" },
            quantity: { type: "integer" },
            status: {
              type: "string",
              enum: ["PENDING", "CONFIRMED", "RELEASED", "EXPIRED"]
            },
            expires_at: { type: "string", format: "date-time" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" }
          }
        },

        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" }
          }
        }
      }
    }
  },

 apis: [
  path.resolve(__dirname, "../routes/*.js").replace(/\\/g, "/")
]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;