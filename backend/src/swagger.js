const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const port = process.env.PORT || 5000;
const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "B3 Dashboard Backend API",
      version: "1.0.0",
      description: "API documentation for the B3 dashboard backend",
    },
    servers: [
      {
        url: serverUrl,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
        },
      },
      parameters: {
        CameraIdQuery: {
          in: "query",
          name: "cameraId",
          required: true,
          schema: {
            type: "string",
            example: "cam_01",
          },
        },
        FromQuery: {
          in: "query",
          name: "from",
          required: true,
          schema: {
            type: "string",
            format: "date-time",
            example: "2026-05-02T00:00:00Z",
          },
        },
        ToQuery: {
          in: "query",
          name: "to",
          required: true,
          schema: {
            type: "string",
            format: "date-time",
            example: "2026-05-02T01:00:00Z",
          },
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "bad_request",
            },
            message: {
              type: "string",
              example: "cameraId is required",
            },
          },
        },
        WelcomeResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Welcome to the B3 Dashboard Backend API",
            },
          },
        },
        Camera: {
          type: "object",
          properties: {
            cameraId: {
              type: "string",
              example: "cam_01",
            },
            lastSeen: {
              type: "string",
              nullable: true,
              format: "date-time",
              example: "2026-05-02T10:00:05.000Z",
            },
            stale: {
              type: "boolean",
              example: false,
            },
          },
        },
        TrafficMetric: {
          type: "object",
          properties: {
            cameraId: {
              type: "string",
              example: "cam_01",
            },
            windowStart: {
              type: "string",
              nullable: true,
              format: "date-time",
              example: "2026-05-02T10:00:00.000Z",
            },
            windowEnd: {
              type: "string",
              nullable: true,
              format: "date-time",
              example: "2026-05-02T10:00:05.000Z",
            },
            laneId: {
              type: "string",
              nullable: true,
              example: null,
            },
            vehicleCount: {
              type: "number",
              example: 12,
            },
            countsByClass: {
              type: "object",
              additionalProperties: {
                type: "number",
              },
              example: {
                car: 10,
                bus: 2,
              },
            },
            averageSpeedKmh: {
              type: "number",
              example: 31.5,
            },
            stoppedRatio: {
              type: "number",
              example: 0.2,
            },
            queueLength: {
              type: "number",
              example: 4,
            },
            congestionLevel: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
              example: "HIGH",
            },
            congestionScore: {
              type: "number",
              example: 82.4,
            },
            stale: {
              type: "boolean",
              example: false,
            },
          },
        },
        AnalyticsSummary: {
          type: "object",
          properties: {
            cameraId: {
              type: "string",
              example: "cam_01",
            },
            from: {
              type: "string",
              format: "date-time",
              example: "2026-05-02T00:00:00Z",
            },
            to: {
              type: "string",
              format: "date-time",
              example: "2026-05-02T01:00:00Z",
            },
            totalWindows: {
              type: "number",
              example: 12,
            },
            totalVehicles: {
              type: "number",
              example: 180,
            },
            averageCongestionScore: {
              type: "number",
              example: 64.25,
            },
            averageSpeedKmh: {
              type: "number",
              example: 28.4,
            },
            peakWindow: {
              nullable: true,
              allOf: [{ $ref: "#/components/schemas/TrafficMetric" }],
            },
            series: {
              type: "array",
              items: {
                $ref: "#/components/schemas/TrafficMetric",
              },
            },
          },
        },
        Alert: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "ALERT-cam_01-2026-05-02T10:00:05.000Z",
            },
            type: {
              type: "string",
              example: "congestion",
            },
            severity: {
              type: "string",
              enum: ["informational", "warning", "critical", "emergency"],
              example: "critical",
            },
            cameraId: {
              type: "string",
              example: "cam_01",
            },
            title: {
              type: "string",
              example: "CRITICAL congestion at cam_01",
            },
            description: {
              type: "string",
              example: "Congestion score 82.4 with 12 vehicles in the latest window.",
            },
            status: {
              type: "string",
              example: "active",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2026-05-02T10:00:05.000Z",
            },
            details: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        Location: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "CAM-cam_01",
            },
            type: {
              type: "string",
              enum: ["sensor", "incident"],
              example: "incident",
            },
            severity: {
              type: "string",
              enum: ["info", "warning", "critical", "emergency"],
              example: "critical",
            },
            lat: {
              type: "number",
              example: 6.0248,
            },
            lng: {
              type: "number",
              example: 80.2172,
            },
            title: {
              type: "string",
              example: "Traffic camera cam_01",
            },
            description: {
              type: "string",
              example: "HIGH congestion, 31.5 km/h average speed.",
            },
            status: {
              type: "string",
              enum: ["active", "stale"],
              example: "active",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2026-05-02T10:00:05.000Z",
            },
            details: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        UserSession: {
          type: "object",
          properties: {
            authenticated: {
              type: "boolean",
              example: true,
            },
            user: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["ok", "degraded"],
              example: "degraded",
            },
            service: {
              type: "string",
              example: "b3-dashboard-backend",
            },
            upstream: {
              type: "object",
              properties: {
                b2: {
                  type: "object",
                  additionalProperties: true,
                  example: {
                    status: "degraded",
                    kafka: "unreachable",
                    postgres: "ok",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "app.js"), path.join(__dirname, "routes", "*.js")],
};

module.exports = swaggerJsdoc(options);
