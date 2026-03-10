import { Request, Response, NextFunction } from 'express';
import * as adminRepository from '../repositories/adminRepository';
import * as gameDumpService from '../services/gameDumpService';
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

/** 게임 데이터 SQL 덤프 다운로드 (스테이징 마이그레이션용) */
export const dumpGameData = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sql = await gameDumpService.generateGameDataDump();
    const filename = `game_data_${new Date().toISOString().slice(0, 10)}.sql`;
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sql);
  } catch (error) {
    next(error);
  }
};
