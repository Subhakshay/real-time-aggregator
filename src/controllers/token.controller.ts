import { Request, Response } from 'express';
import * as tokenService from '../services/token.service';

export const getTokens = async (req: Request, res: Response) => {
    try {
        // Get query params for filtering, sorting, and pagination
        const {
            q = 'SOL', // The search query
            sortBy = 'volume_sol', // [cite: 23]
            sortOrder = 'desc',
            limit = '20', // [cite: 34]
            cursor // [cite: 24]
        } = req.query;

        const result = await tokenService.getProcessedTokens(
            String(q),
            sortBy,
            sortOrder,
            parseInt(limit as string, 10),
            cursor as string
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getTokens controller:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};