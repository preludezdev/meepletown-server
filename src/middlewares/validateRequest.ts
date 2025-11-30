import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

// 기본 요청 검증 미들웨어 (필수 필드 체크)
export const validateRequest = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!req.body[field] && req.body[field] !== 0) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      sendError(
        res,
        'BAD_REQUEST',
        `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
        400
      );
      return;
    }

    next();
  };
};

