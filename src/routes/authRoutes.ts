import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// 카카오 로그인
router.post(
  '/kakao',
  validateRequest(['accessToken']),
  authController.kakaoLogin
);

// 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
