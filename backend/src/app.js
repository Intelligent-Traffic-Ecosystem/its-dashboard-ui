const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/auth");
const locationRoutes = require("./routes/locations");
const swaggerSpec = require("./swagger");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(","), credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "b3-dashboard-backend" });
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the B3 Dashboard Backend API" });
});

module.exports = app;
