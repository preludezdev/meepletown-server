import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * production 환경에서만 허용되는 API에 사용하는 미들웨어.
 * staging/development에서 호출 시 403을 반환한다.
 * 주로 대량 알림 발송, 강제 BGG 동기화 등 외부 영향이 큰 API에 적용.
 */
export const productionOnly = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!env.isProduction) {
    res.status(403).json({
      success: false,
      message: `[${env.appEnv.toUpperCase()}] 이 API는 production 환경에서만 사용할 수 있습니다.`,
    });
    return;
  }
  next();
};

/**
 * non-production 환경에서 요청 정보를 로그로 남기는 미들웨어.
 * 실제 외부 연동 없이 요청이 올바르게 도달하는지 확인할 때 사용.
 */
export const stagingLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!env.isProduction) {
    console.log(`[${env.appEnv.toUpperCase()}] ${req.method} ${req.originalUrl}`, {
      body: req.body,
      query: req.query,
    });
  }
  next();
};
