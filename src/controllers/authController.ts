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

// 번호인증 완료 후 서버에 전화번호 저장
export const verifyPhone = async (
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

    const { phoneNumber } = req.body;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      sendError(res, 'BAD_REQUEST', 'phoneNumber가 필요합니다', 400);
      return;
    }

    // E.164 형식 검증 (간단히 숫자+만 허용)
    const trimmed = phoneNumber.trim();
    if (!/^\+?[0-9]{10,15}$/.test(trimmed)) {
      sendError(res, 'BAD_REQUEST', '올바른 전화번호 형식이 아닙니다', 400);
      return;
    }

    const user = await authService.verifyPhone(userId, trimmed);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
