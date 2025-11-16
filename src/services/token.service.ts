// src/services/token.service.ts

import * as apiService from './api.service';
import * as cache from './cache.service';
import { Token } from '../interfaces/token.interface';
import { PaginatedResult, paginateTokens, sortTokens, mergeTokens } from '../utils/helpers';
import { config } from '../config';

const AGGREGATED_TOKENS_CACHE_KEY = 'all_tokens';

/**
 * Fetches all tokens, from cache or by aggregating APIs.
 * This is called by the REST controller AND the WebSocket poller.
 */
export const getAggregatedTokens = async (query: string = 'SOL'): Promise<Token[]> => {
    const cacheKey = `${AGGREGATED_TOKENS_CACHE_KEY}:${query}`;

    // 1. Try to get from cache
    const cachedData = await cache.getFromCache<Token[]>(cacheKey);
    if (cachedData) {
        console.log('Cache HIT');
        return cachedData;
    }

    console.log('Cache MISS');
    // 2. If miss, fetch from all sources
    const [dexData, jupData] = await Promise.all([
        apiService.fetchFromDexScreener(query),
        apiService.fetchFromJupiter(query),
    ]);

    // 3. Merge data
    const mergedData = mergeTokens([dexData, jupData]);

    // 4. Set in cache with 30s TTL
    await cache.setInCache(cacheKey, mergedData, config.cache.ttlSeconds);

    return mergedData;
};

/**
 * Gets tokens and applies filtering, sorting, and pagination.
 * This is what the REST controller will use.
 */
export const getProcessedTokens = async (
    query: string,
    sortBy: any,
    sortOrder: any,
    limit: number,
    cursor?: string
): Promise<PaginatedResult> => {

    // 1. Get the full, merged list
    let tokens = await getAggregatedTokens(query);

    // 2. Apply filtering (if any)
    // We'll filter out tokens with no volume.
    tokens = tokens.filter(t => t.volume_sol > 0);

    // 3. Apply sorting
    if (sortBy && (sortBy === 'volume_sol' || sortBy === 'price_1hr_change' || sortBy === 'market_cap_sol')) {
        tokens = sortTokens(tokens, sortBy, sortOrder === 'asc' ? 'asc' : 'desc');
    } else {
        // Default sort by volume
        tokens = sortTokens(tokens, 'volume_sol', 'desc');
    }

    // 4. Apply pagination
    return paginateTokens(tokens, limit, cursor);
};