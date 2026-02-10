import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     summary: Google 로그인
 *     description: Google OAuth accessToken으로 로그인하여 JWT를 발급받습니다. 클라이언트에서 Google 로그인 후 받은 accessToken을 전달하세요.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Google OAuth에서 발급받은 access_token
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 반환
 *       400:
 *         description: accessToken 필요
 */
// 구글 로그인
router.post(
  '/google',
  validateRequest(['accessToken']),
  authController.googleLogin
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     description: 로그인한 사용자 정보를 조회합니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보
 *       401:
 *         description: 인증 필요
 */
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
