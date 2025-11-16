import axios from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../config';
import { Token } from '../interfaces/token.interface';

const apiClient = axios.create();

// Implement exponential backoff for rate limiting 
axiosRetry(apiClient, {
    retries: 3,
    retryDelay: (retryCount) => {
        console.log(`Retry attempt ${retryCount}`);
        return retryCount * 1000; // 1s, 2s, 3s
    },
    retryCondition: (error) => {
        // Retry on 5xx errors or network errors
        return error.response?.status === 429 || axiosRetry.isNetworkOrIdempotentRequestError(error);
    },
});

/**
 * Fetches and transforms data from DexScreener [cite: 7]
 */
export const fetchFromDexScreener = async (query: string): Promise<Token[]> => {
    try {
        const response = await apiClient.get(`${config.api.dexScreener}${query}`);

        // DexScreener returns 'pairs'. We need to transform them.
        if (!response.data.pairs) return [];

        return response.data.pairs.map((pair: any): Token | null => {
            if (!pair.baseToken || !pair.liquidity) return null;

            // This mapping assumes the sample data  format
            return {
                token_address: pair.baseToken.address,
                token_name: pair.baseToken.name,
                token_ticker: pair.baseToken.symbol,
                price_sol: parseFloat(pair.priceNative), // Assuming priceNative is SOL
                market_cap_sol: parseFloat(pair.fdv), // Using FDV as market cap
                volume_sol: parseFloat(pair.volume.h24), // 24h volume
                liquidity_sol: parseFloat(pair.liquidity.usd) / parseFloat(pair.priceNative), // Approx
                price_1hr_change: parseFloat(pair.priceChange.h1),
                source_dex: pair.dexId,
            };
        }).filter((token: Token | null): token is Token => token !== null);

    } catch (error) {
        console.error('DexScreener API Error:', error.message);
        return [];
    }
};

/**
 * Fetches and transforms data from Jupiter [cite: 8]
 */
export const fetchFromJupiter = async (query: string): Promise<Token[]> => {
    try {
        const response = await apiClient.get(`${config.api.jupiter}${query}`);

        // Jupiter API has a different structure
        if (!response.data) return [];

        return response.data.map((token: any): Token | null => {
            if (!token.address) return null;

            // This is a partial mapping, as Jupiter's free API is simple
            return {
                token_address: token.address,
                token_name: token.name,
                token_ticker: token.symbol,
                price_sol: token.price, // This price might not be in SOL
                market_cap_sol: token.marketCap, // This might not be in SOL
                volume_sol: 0, // Jupiter basic API doesn't provide this
                liquidity_sol: 0, // Or this
                price_1hr_change: 0, // Or this
                source_dex: 'Jupiter',
            };
        }).filter((token: Token | null): token is Token => token !== null);

    } catch (error) {
        console.error('Jupiter API Error:', error.message);
        return [];
    }
};