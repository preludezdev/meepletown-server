import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/google-url:
 *   get:
 *     summary: Google OAuth 테스트 가이드 (Swagger용)
 *     description: Swagger에서 Google 로그인을 테스트하기 위한 가이드를 제공합니다. Google OAuth Playground를 사용하여 accessToken을 받아올 수 있습니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 가이드 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 *                       description: Google OAuth Playground URL
 *                     instructions:
 *                       type: string
 *                       description: 상세 사용 방법 안내
 *                     scopes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 필요한 OAuth 스코프 목록
 */
router.get('/google-url', authController.getGoogleAuthUrl);

// 구글 로그인
router.post(
  '/google',
  validateRequest(['accessToken']),
  authController.googleLogin
);

// 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
