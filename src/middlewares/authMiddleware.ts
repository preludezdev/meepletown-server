import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { findUserById } from '../repositories/userRepository';
import { UnauthorizedError } from '../utils/errors';

// Request 타입 확장
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    nickname: string;
  };
}

// JWT 인증 미들웨어
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('인증 토큰이 필요합니다');
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 토큰 검증
    const decoded = verifyToken(token);

    // 사용자 정보 조회
    const user = await findUserById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('유효하지 않은 사용자입니다');
    }

    // Request 객체에 사용자 정보 추가
    (req as AuthRequest).user = {
      userId: user.id,
      nickname: user.nickname,
    };

    next();
  } catch (error) {
    next(error);
  }
};
