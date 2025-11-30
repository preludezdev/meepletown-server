import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { env } from '../config/env';

// 에러 핸들링 미들웨어
export const errorHandler = (
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // AppError 인스턴스인 경우
  if (error instanceof AppError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  // 일반 에러인 경우
  console.error('Unexpected error:', error);

  // 개발 환경에서는 상세 에러 정보 제공
  const message =
    env.nodeEnv === 'development'
      ? error.message || '서버 오류가 발생했습니다'
      : '서버 오류가 발생했습니다';

  sendError(res, 'INTERNAL_SERVER_ERROR', message, 500);
};

// 404 핸들러
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  sendError(res, 'NOT_FOUND', `경로를 찾을 수 없습니다: ${req.originalUrl}`, 404);
};

