// Based on the sample structure provided 
export interface Token {
    token_address: string;
    token_name: string;
    token_ticker: string;
    price_sol: number;
    market_cap_sol: number;
    volume_sol: number; // This will be our 24h volume
    liquidity_sol: number;
    price_1hr_change: number;
    // We add this to track the original source
    source_dex: string;
}