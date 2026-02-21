import { Request, Response, NextFunction } from 'express';

/**
 * ADMIN_SECRET 환경변수와 X-Admin-Key 헤더를 비교해 어드민 요청 인증
 * Railway 환경변수 ADMIN_SECRET이 설정되지 않으면 항상 거부
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    res.status(403).json({
      success: false,
      error: 'Admin access is not configured on this server',
    });
    return;
  }

  const providedKey = req.headers['x-admin-key'];

  if (!providedKey || providedKey !== adminSecret) {
    res.status(401).json({
      success: false,
      error: 'Invalid admin key',
    });
    return;
  }

  next();
};
