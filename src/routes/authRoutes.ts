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

/**
 * @swagger
 * /api/v1/auth/verify-phone:
 *   post:
 *     summary: 번호인증 완료
 *     description: Firebase Phone Auth로 인증 완료 후 서버에 전화번호를 저장합니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: "E.164 형식 전화번호 (예 +821012345678)"
 *     responses:
 *       200:
 *         description: 인증 완료, 사용자 정보 반환
 *       400:
 *         description: phoneNumber 형식 오류
 *       401:
 *         description: 인증 필요
 */
router.post(
  '/verify-phone',
  authenticate,
  validateRequest(['phoneNumber']),
  authController.verifyPhone
);

export default router;
