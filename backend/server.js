require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const env = require("./src/config/env");
const createSocketServer = require("./src/socket");
const { trafficDataProvider } = require("./src/services");

const PORT = env.port;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: env.allowedOrigins.length ? env.allowedOrigins : "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const socketBridge = createSocketServer(io, { trafficDataProvider });

server.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
});

function shutdown() {
    socketBridge.unsubscribe();
    server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
