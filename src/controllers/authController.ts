import { Request, Response, NextFunction } from 'express';
import * as googleAuthService from '../services/googleAuthService';
import * as authService from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';

// 구글 로그인
export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      sendError(res, 'BAD_REQUEST', '구글 accessToken이 필요합니다', 400);
      return;
    }

    const result = await googleAuthService.googleLogin(accessToken);
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
