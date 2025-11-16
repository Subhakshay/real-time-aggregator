import express from 'express';
import http from 'http';
import { config } from './config';
import { initializeWebSocket } from './managers/socket.manager';
import * as tokenController from './controllers/token.controller';

const app = express();
const httpServer = http.createServer(app);

// --- Middleware ---
app.use(express.json());
// Simple logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- REST API Routes ---
app.get('/tokens', tokenController.getTokens);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- Initialize WebSocket ---
initializeWebSocket(httpServer);

// --- Start Server ---
httpServer.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
});