// src/utils/helpers.test.ts

import { sortTokens, paginateTokens, diffTokenLists, mergeTokens } from './helpers';
import { Token } from '../interfaces/token.interface';

// --- Mock Data ---
const getMockToken = (id: string, volume: number, priceChange: number, liquidity: number): Token => ({
    token_address: id,
    volume_sol: volume,
    price_1hr_change: priceChange,
    liquidity_sol: liquidity,
    token_name: `Token ${id}`,
    token_ticker: id.toUpperCase(),
    price_sol: 10,
    market_cap_sol: 1000,
    source_dex: 'dex1',
});

const mockTokens: Token[] = [
    getMockToken('a', 100, 1, 1000),
    getMockToken('b', 300, -2, 2000),
    getMockToken('c', 200, 5, 3000),
    getMockToken('d', 50, 0, 500),
    getMockToken('e', 400, 10, 1500),
];

// --- Tests ---

describe('Helper: sortTokens', () => {
    it('should sort tokens by volume_sol descending', () => {
        const sorted = sortTokens(mockTokens, 'volume_sol', 'desc');
        expect(sorted.map(t => t.token_address)).toEqual(['e', 'b', 'c', 'a', 'd']);
    });

    it('should sort tokens by price_1hr_change ascending', () => {
        const sorted = sortTokens(mockTokens, 'price_1hr_change', 'asc');
        expect(sorted.map(t => t.token_address)).toEqual(['b', 'd', 'a', 'c', 'e']);
    });

    it('should handle sorting an empty array', () => {
        const sorted = sortTokens([], 'volume_sol', 'desc');
        expect(sorted).toEqual([]);
    });

    it('should treat null/undefined values as 0 during sort', () => {
        const tokensWithNull: any[] = [
            getMockToken('a', 100, 1, 1000),
            getMockToken('b', 300, -2, 2000),
            { token_address: 'c', price_1hr_change: null }, // This should be treated as 0
        ];
        const sorted = sortTokens(tokensWithNull, 'price_1hr_change', 'asc');
        expect(sorted.map(t => t.token_address)).toEqual(['b', 'c', 'a']);
    });
});

describe('Helper: paginateTokens', () => {
    it('should return the first page with a next cursor', () => {
        const result = paginateTokens(mockTokens, 2);
        expect(result.data.length).toBe(2);
        expect(result.data[0].token_address).toBe('a');
        expect(result.nextCursor).toBe('b');
    });

    it('should return the second page using a cursor', () => {
        const result = paginateTokens(mockTokens, 2, 'b'); // cursor is 'b'
        expect(result.data.length).toBe(2);
        expect(result.data[0].token_address).toBe('c');
        expect(result.nextCursor).toBe('d');
    });

    it('should return the last page with a null next cursor', () => {
        const result = paginateTokens(mockTokens, 2, 'd'); // cursor is 'd'
        expect(result.data.length).toBe(1);
        expect(result.data[0].token_address).toBe('e');
        expect(result.nextCursor).toBe(null);
    });

    it('should handle an invalid cursor by starting from the beginning', () => {
        const result = paginateTokens(mockTokens, 2, 'z'); // 'z' doesn't exist
        expect(result.data.length).toBe(2);
        expect(result.data[0].token_address).toBe('a');
        expect(result.nextCursor).toBe('b');
    });
});

describe('Helper: diffTokenLists', () => {
    const oldList = [getMockToken('a', 100, 1, 1000)];

    it('should return empty array if no changes', () => {
        const newList = [getMockToken('a', 100, 1, 1000)];
        const updates = diffTokenLists(oldList, newList);
        expect(updates.length).toBe(0);
    });

    it('should detect a price change', () => {
        const newList = [getMockToken('a', 100, 1, 1000)];
        newList[0].price_sol = 99; // Change price
        const updates = diffTokenLists(oldList, newList);
        expect(updates.length).toBe(1);
        expect(updates[0].token_address).toBe('a');
        expect(updates[0].price_sol).toBe(99);
    });
});

describe('Helper: mergeTokens', () => {
    it('should merge two lists, prioritizing higher liquidity', () => {
        const source1 = [getMockToken('a', 100, 1, 1000)]; // Lower liquidity
        const source2 = [getMockToken('a', 150, 5, 2000)]; // Higher liquidity

        const merged = mergeTokens([source1, source2]);
        expect(merged.length).toBe(1);
        expect(merged[0].volume_sol).toBe(150); // Should take data from source 2
        expect(merged[0].liquidity_sol).toBe(2000);
    });

    it('should fill in missing data from lower-liquidity source', () => {
        const source1: Token[] = [{
            token_address: 'a',
            volume_sol: 100,
            price_1hr_change: 1, // Only in source 1
            liquidity_sol: 2000, // Higher liquidity
        } as Token];

        const source2: Token[] = [{
            token_address: 'a',
            volume_sol: 50, // Only in source 2
            liquidity_sol: 1000, // Lower liquidity
        } as Token];

        const merged = mergeTokens([source1, source2]);
        expect(merged.length).toBe(1);
        expect(merged[0].liquidity_sol).toBe(2000); // From source 1
        expect(merged[0].price_1hr_change).toBe(1); // From source 1
        expect(merged[0].volume_sol).toBe(100); // From source 1 (as it was higher liq)
    });
});