import { Request, Response, NextFunction } from 'express';
import * as settingsRepository from '../repositories/settingsRepository';
import { runSyncNow } from '../services/schedulerService';
import { sendSuccess } from '../utils/response';

/** 배치 설정 조회 */
export const getBatchSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsRepository.getBatchSettings();
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

/** 배치 설정 수정 */
export const updateBatchSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { enabled, hour, size } = req.body || {};
    await settingsRepository.updateBatchSettings({
      ...(enabled !== undefined && { enabled: Boolean(enabled) }),
      ...(hour !== undefined && { hour: Number(hour) }),
      ...(size !== undefined && { size: Number(size) }),
    });
    const updated = await settingsRepository.getBatchSettings();
    sendSuccess(res, { message: '배치 설정이 저장되었습니다', settings: updated });
  } catch (error) {
    next(error);
  }
};

/** 즉시 동기화 실행 */
export const runBatchNow = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await runSyncNow();
    sendSuccess(res, { message: 'BGG Hot List 동기화가 완료되었습니다' });
  } catch (error) {
    next(error);
  }
};
