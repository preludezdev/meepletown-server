import { Request, Response, NextFunction } from 'express';
import * as kakaoAuthService from '../services/kakaoAuthService';
import * as authService from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';

// 카카오 로그인
export const kakaoLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      sendError(res, 'BAD_REQUEST', '카카오 accessToken이 필요합니다', 400);
      return;
    }

    const result = await kakaoAuthService.kakaoLogin(accessToken);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// 현재 사용자 정보 조회
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }

    const user = await authService.getCurrentUser(userId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
