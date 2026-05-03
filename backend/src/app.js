const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/auth");
const locationRoutes = require("./routes/locations");
const createTrafficRouter = require("./routes/traffic");
const createAnalyticsRouter = require("./routes/analytics");
const createAlertsRouter = require("./routes/alerts");
const createHealthRouter = require("./routes/health");
const requireAuth = require("./middleware/requireAuth");
const errorHandler = require("./middleware/errorHandler");
const swaggerSpec = require("./swagger");
const {
  trafficService,
  analyticsService,
  alertService,
  healthService,
} = require("./services");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(","), credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use(
  "/api/traffic",
  createTrafficRouter({
    trafficService,
    requireAuth,
  })
);
app.use(
  "/api/analytics",
  createAnalyticsRouter({
    analyticsService,
    requireAuth,
  })
);
app.use(
  "/api/alerts",
  createAlertsRouter({
    alertService,
    requireAuth,
  })
);
app.use("/health", createHealthRouter({ healthService }));

/**
 * @openapi
 * /:
 *   get:
 *     summary: Get API welcome message
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Backend API welcome message.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WelcomeResponse'
 */
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the B3 Dashboard Backend API" });
});

app.use(errorHandler);

module.exports = app;
