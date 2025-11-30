import { Request, Response, NextFunction } from 'express';
import * as listingService from '../services/listingService';
import { sendSuccess } from '../utils/response';

// 오늘의 매물 조회
export const getTodayListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const listings = await listingService.getTodayListings(limit);
    sendSuccess(res, listings);
  } catch (error) {
    next(error);
  }
};

