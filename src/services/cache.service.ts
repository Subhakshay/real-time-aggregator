import Redis from 'ioredis';
import { config } from '../config';

// Create a singleton instance
const redisClient = new Redis(config.redis.url);

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis successfully!');
});

export const getFromCache = async <T>(key: string): Promise<T | null> => {
    try {
        const data = await redisClient.get(key);
        return data ? (JSON.parse(data) as T) : null;
    } catch (err) {
        console.error(`Error getting from cache for key ${key}:`, err);
        return null;
    }
};

export const setInCache = async (
    key: string,
    value: any,
    ttlInSeconds: number = config.cache.ttlSeconds
): Promise<void> => {
    try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
    } catch (err) {
        console.error(`Error setting cache for key ${key}:`, err);
    }
};