import { Request, Response, NextFunction } from 'express';
import * as adminRepository from '../repositories/adminRepository';
import { sendSuccess } from '../utils/response';

export const getStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await adminRepository.getAdminStats();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};
