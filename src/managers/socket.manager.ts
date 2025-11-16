import { Server as HttpServer } from 'http';
import { Server as SocketIoServer } from 'socket.io';
import * as tokenService from '../services/token.service';
import { Token } from '../interfaces/token.interface';
import { config } from '../config';
import { diffTokenLists } from '../utils/helpers';

let io: SocketIoServer;
let currentTokenState: Token[] = [];

/**
 * This function fetches new data, compares it,
 * broadcasts updates, and updates the server's state.
 */
const pollTokens = async () => {
    try {
        console.log('Polling for token updates...');
        const newData = await tokenService.getAggregatedTokens('SOL'); // Poll for default query

        // Diff the new data with the old data
        const updates = diffTokenLists(currentTokenState, newData);

        if (updates.length > 0) {
            console.log(`Found ${updates.length} token updates. Broadcasting...`);
            // Broadcast *only the changes*
            io.emit('tokenUpdates', updates);
        }

        // --- THIS IS THE CRITICAL FIX ---
        // Always update the current state, even if there were no updates to broadcast.
        currentTokenState = newData;

    } catch (error) {
        console.error('Error during token polling:', error);
    }
};

// This function just manages the connection logic
export const initializeWebSocket = (httpServer: HttpServer) => {
    io = new SocketIoServer(httpServer, {
        cors: {
            origin: '*', // Allow all for demo
        },
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Send the *current full state* to the new user
        // This will now have data because we poll on start
        socket.emit('initialTokenList', currentTokenState);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    console.log('WebSocket Manager initialized.');

    // --- THIS IS THE OTHER CRITICAL FIX ---
    // 1. Run the poll one time on startup
    console.log('Running initial token poll...');
    pollTokens();

    // 2. Then, set up the interval to run it regularly
    setInterval(pollTokens, config.pollingInterval);
};