import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    api: {
        dexScreener: 'https://api.dexscreener.com/latest/dex/search?q=',
        jupiter: 'https://lite-api.jup.ag/tokens/v2/search?query=',
    },
    cache: {
        ttlSeconds: 30, // Default 30s TTL as required 
    },
    pollingInterval: 15000, // Poll every 15s (faster than cache TTL)
};