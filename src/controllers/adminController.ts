import { Request, Response, NextFunction } from 'express';
import * as adminRepository from '../repositories/adminRepository';
import * as gameDumpService from '../services/gameDumpService';
import * as gameRestoreService from '../services/gameRestoreService';
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

/** 게임 데이터 SQL 복원 (덤프 파일 업로드 → 현재 DB에 적용) */
export const restoreGameData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sql = typeof req.body?.sql === 'string' ? req.body.sql : '';
    if (!sql.trim()) {
      res.status(400).json({ success: false, error: 'sql 필드가 필요합니다.' });
      return;
    }
    const result = await gameRestoreService.restoreGameDataFromSql(sql);
    if (result.ok) {
      sendSuccess(res, { message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error) {
    next(error);
  }
};
