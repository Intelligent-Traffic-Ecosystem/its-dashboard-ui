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
    },
  },
  apis: [path.join(__dirname, "app.js"), path.join(__dirname, "routes", "*.js")],
};

module.exports = swaggerJsdoc(options);
