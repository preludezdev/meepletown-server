import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import * as settingsRepository from '../repositories/settingsRepository';
import { runSyncNow } from '../services/schedulerService';
import { sendSuccess } from '../utils/response';

// 배치 진행률 (in-memory, 프로그레스바용)
let batchProgress: {
  status: 'idle' | 'running';
  current: number;
  total: number;
  error?: string;
} = { status: 'idle', current: 0, total: 0 };

export const getBatchProgress = () => ({ ...batchProgress });

/** 배치 설정 조회 (appEnv, canConfigureBatch 포함) */
export const getBatchSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsRepository.getBatchSettings();
    sendSuccess(res, {
      ...settings,
      appEnv: env.appEnv,
      canConfigureBatch: env.isProduction,
    });
  } catch (error) {
    next(error);
  }
};

/** 배치 설정 수정 (프로덕션 전용) */
export const updateBatchSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!env.isProduction) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '배치 설정은 프로덕션 환경에서만 변경할 수 있습니다.' },
      });
      return;
    }
    const { enabled, hour, size, source, requestDelayMs } = req.body || {};
    await settingsRepository.updateBatchSettings({
      ...(enabled !== undefined && { enabled: Boolean(enabled) }),
      ...(hour !== undefined && { hour: Number(hour) }),
      ...(size !== undefined && { size: Number(size) }),
      ...(source === 'hot' || source === 'csv' ? { source } : {}),
      ...(requestDelayMs !== undefined && { requestDelayMs: Number(requestDelayMs) }),
    });
    const updated = await settingsRepository.getBatchSettings();
    sendSuccess(res, { message: '배치 설정이 저장되었습니다', settings: updated });
  } catch (error) {
    next(error);
  }
};

/** 배치 진행률 조회 (프로그레스바 폴링용) */
export const getBatchProgressHandler = (
  _req: Request,
  res: Response
): void => {
  sendSuccess(res, getBatchProgress());
};

/** 즉시 동기화 실행 (프로덕션 전용, 백그라운드 실행) */
export const runBatchNow = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!env.isProduction) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '배치 실행은 프로덕션 환경에서만 가능합니다.' },
      });
      return;
    }
    if (batchProgress.status === 'running') {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: '이미 배치가 실행 중입니다.' },
      });
      return;
    }
    batchProgress = { status: 'running', current: 0, total: 0 };
    res.status(202).json({
      success: true,
      data: { message: '배치가 시작되었습니다. 프로그레스바로 진행률을 확인하세요.' },
    });

    runSyncNow({
      onProgress: (current, total) => {
        batchProgress.current = current;
        batchProgress.total = total;
      },
    })
      .then(() => {
        batchProgress = { ...batchProgress, status: 'idle' };
      })
      .catch((err: Error) => {
        batchProgress = {
          status: 'idle',
          current: 0,
          total: 0,
          error: err.message,
        };
        console.error('❌ 배치 수동 실행 실패:', err.message);
      });
  } catch (error) {
    next(error);
  }
};
