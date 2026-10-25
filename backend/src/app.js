const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const pool = require("./config/db");
const swaggerSpec = require("./config/swagger");

const productRoutes = require("./routes/productRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

const errorHandler = require("./middlewares/errorHandler");
const startExpiryJob = require("./jobs/expireReservations");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

app.use("/api", apiLimiter);

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Inventory Reservation API is running"
  });
});

// Product Routes
app.use("/api/products", productRoutes);

// Reservation Routes
app.use("/api/reservations", reservationRoutes);

// Invalid Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  try {
    await pool.query("SELECT 1");

    console.log("PostgreSQL connected successfully!");

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    const expiryInterval = startExpiryJob();

    const shutdown = () => {
      clearInterval(expiryInterval);

      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;