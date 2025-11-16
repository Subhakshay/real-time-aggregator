// src/utils/helpers.ts

import { Token } from '../interfaces/token.interface';

// --- Sorting Logic ---
type SortKey = 'volume_sol' | 'price_1hr_change' | 'market_cap_sol';
type SortOrder = 'asc' | 'desc';

export const sortTokens = (tokens: Token[], key: SortKey, order: SortOrder): Token[] => {
    return [...tokens].sort((a, b) => {
        // Handle null or undefined values by treating them as 0
        const valA = a[key] || 0;
        const valB = b[key] || 0;
        return order === 'asc' ? valA - valB : valB - valA;
    });
};

// --- Pagination Logic ---
export interface PaginatedResult {
    data: Token[];
    nextCursor: string | null;
}

export const paginateTokens = (
    tokens: Token[],
    limit: number,
    cursor?: string
): PaginatedResult => {
    let startIndex = 0;

    if (cursor) {
        const cursorIndex = tokens.findIndex(t => t.token_address === cursor);
        if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
        }
    }

    const endIndex = startIndex + limit;
    const data = tokens.slice(startIndex, endIndex);

    const nextCursor = data.length === limit && endIndex < tokens.length
        ? data[data.length - 1].token_address
        : null;

    return { data, nextCursor };
};

// --- WebSocket Diff Logic ---
export interface TokenUpdate {
    token_address: string;
    price_sol: number;
    volume_sol: number;
    price_1hr_change: number;
}

export const diffTokenLists = (oldTokens: Token[], newTokens: Token[]): TokenUpdate[] => {
    const updates: TokenUpdate[] = [];
    const oldTokenMap = new Map(oldTokens.map(t => [t.token_address, t]));

    for (const newToken of newTokens) {
        const oldToken = oldTokenMap.get(newToken.token_address);

        if (!oldToken) {
            // This is a new token, not an update. We'll ignore it for this diff.
            continue;
        }

        if (oldToken.price_sol !== newToken.price_sol ||
            oldToken.volume_sol !== newToken.volume_sol ||
            oldToken.price_1hr_change !== newToken.price_1hr_change) {

            updates.push({
                token_address: newToken.token_address,
                price_sol: newToken.price_sol,
                volume_sol: newToken.volume_sol,
                price_1hr_change: newToken.price_1hr_change,
            });
        }
    }
    return updates;
};

// --- Aggregation Logic ---
/**
 * Merges token lists from multiple sources.
 * It intelligently picks the best data (e..g, from the source with more liquidity).
 */
export const mergeTokens = (sources: Token[][]): Token[] => {
    const tokenMap = new Map<string, Token>();

    for (const source of sources) {
        for (const token of source) {
            const existing = tokenMap.get(token.token_address);

            if (!existing) {
                // If new, add it
                tokenMap.set(token.token_address, token);
            } else {
                // If duplicate, merge. Prioritize data from source with higher liquidity.
                if (token.liquidity_sol > existing.liquidity_sol) {
                    // New token has better data, replace, but fill missing fields
                    const mergedToken = { ...token, ...existing, ...token };
                    tokenMap.set(token.token_address, mergedToken);

                } else {
                    // Existing token is better, but fill in missing fields from new token
                    const mergedToken = { ...existing, ...token, ...existing };
                    tokenMap.set(token.token_address, mergedToken);
                }
            }
        }
    }
    return Array.from(tokenMap.values());
};