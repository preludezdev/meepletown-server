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

// Google OAuth URL 생성 (Swagger 테스트용)
export const getGoogleAuthUrl = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Google OAuth Playground 사용 안내
    const instructions = `
Swagger에서 Google 로그인 테스트 방법:

1. Google OAuth Playground 접속:
   https://developers.google.com/oauthplayground/

2. 왼쪽에서 다음 스코프 선택:
   - https://www.googleapis.com/auth/userinfo.email
   - https://www.googleapis.com/auth/userinfo.profile

3. "Authorize APIs" 버튼 클릭
4. Google 계정으로 로그인
5. "Exchange authorization code for tokens" 클릭
6. "access_token" 값을 복사

7. Swagger에서 POST /api/v1/auth/google 실행:
   {
     "accessToken": "복사한_access_token"
   }

8. 응답에서 "token" 값을 복사

9. Swagger 상단 "Authorize" 버튼 클릭
10. Bearer {복사한_token} 입력
11. 이제 인증이 필요한 API를 테스트할 수 있습니다!
    `;

    sendSuccess(res, {
      authUrl: 'https://developers.google.com/oauthplayground/',
      instructions: instructions.trim(),
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
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
