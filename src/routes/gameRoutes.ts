import { Router } from 'express';
import * as gameController from '../controllers/gameController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/v1/games/translation-queue:
 *   get:
 *     summary: 번역 대기열 조회
 *     description: 번역되지 않은 게임 목록을 우선순위순으로 조회합니다.
 *     tags: [Games - Admin]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 조회할 게임 수
 *     responses:
 *       200:
 *         description: 대기열 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/translation-queue', gameController.getTranslationQueue);

/**
 * @swagger
 * /api/v1/games/translation-stats:
 *   get:
 *     summary: 월별 번역 통계 조회
 *     description: 특정 월의 번역 문자 수, 게임 수, 예상 비용을 조회합니다.
 *     tags: [Games - Admin]
 *     parameters:
 *       - in: query
 *         name: yearMonth
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: '2026-02'
 *         description: 조회할 연월 (YYYY-MM). 생략 시 현재 월
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 */
router.get('/translation-stats', gameController.getTranslationStats);

/**
 * @swagger
 * /api/v1/games/{bggId}:
 *   get:
 *     summary: 게임 상세 정보 조회
 *     description: BGG ID로 게임의 상세 정보를 조회합니다. BGG 데이터와 미플온 평점이 통합되어 제공됩니다.
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: bggId
 *         required: true
 *         schema:
 *           type: integer
 *         description: BoardGameGeek 게임 ID (예 - 174430 글룸헤이븐)
 *     responses:
 *       200:
 *         description: 게임 정보 조회 성공
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
 *                     bggId:
 *                       type: integer
 *                     nameEn:
 *                       type: string
 *                     nameKo:
 *                       type: string
 *                     bggRating:
 *                       type: number
 *                     meepleonRating:
 *                       type: number
 *                     categories:
 *                       type: array
 *                     mechanisms:
 *                       type: array
 */
router.get('/:bggId', gameController.getGameDetail);

/**
 * @swagger
 * /api/v1/games/{bggId}/ratings:
 *   get:
 *     summary: 게임 평가 목록 조회
 *     description: 특정 게임에 대한 미플온 사용자 평가 목록을 조회합니다.
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: bggId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 평가 목록 조회 성공
 */
router.get('/:bggId/ratings', gameController.getGameRatings);

/**
 * @swagger
 * /api/v1/games/{bggId}/ratings:
 *   post:
 *     summary: 게임 평가 등록
 *     description: 게임에 평점과 코멘트를 등록합니다. (로그인 필요)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bggId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *                 description: 평점 (0-10)
 *               comment:
 *                 type: string
 *                 description: 평가 코멘트
 *     responses:
 *       201:
 *         description: 평가 등록 성공
 *       401:
 *         description: 인증 필요
 */
router.post(
  '/:bggId/ratings',
  authenticate,
  validateRequest(['rating']),
  gameController.createGameRating
);

/**
 * @swagger
 * /api/v1/games/{bggId}/ratings/{ratingId}:
 *   patch:
 *     summary: 게임 평가 수정
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bggId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: 평가 수정 성공
 */
router.patch(
  '/:bggId/ratings/:ratingId',
  authenticate,
  gameController.updateGameRating
);

/**
 * @swagger
 * /api/v1/games/{bggId}/ratings/{ratingId}:
 *   delete:
 *     summary: 게임 평가 삭제
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bggId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 평가 삭제 성공
 */
router.delete(
  '/:bggId/ratings/:ratingId',
  authenticate,
  gameController.deleteGameRating
);

/**
 * @swagger
 * /api/v1/games/sync/{bggId}:
 *   post:
 *     summary: 게임 수동 동기화
 *     description: BGG에서 게임 정보를 가져와 DB에 저장/업데이트합니다. (임시로 인증 제거됨)
 *     tags: [Games - Admin]
 *     parameters:
 *       - in: path
 *         name: bggId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 동기화 성공
 */
router.post('/sync/:bggId', gameController.syncGame); // 임시로 authenticate 제거

/**
 * @swagger
 * /api/v1/games/sync:
 *   post:
 *     summary: 여러 게임 일괄 동기화
 *     description: 여러 게임을 한번에 동기화합니다. (임시로 인증 제거됨)
 *     tags: [Games - Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bggIds
 *             properties:
 *               bggIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [174430, 167791, 233078]
 *     responses:
 *       200:
 *         description: 동기화 성공
 */
router.post(
  '/sync',
  validateRequest(['bggIds']),
  gameController.syncGames
); // 임시로 authenticate 제거

/**
 * @swagger
 * /api/v1/games/{bggId}/translate:
 *   post:
 *     summary: 단일 게임 번역
 *     description: 특정 게임의 설명을 Papago API로 번역합니다. (관리자용, 인증 불필요)
 *     tags: [Games - Admin]
 *     parameters:
 *       - in: path
 *         name: bggId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 번역할 게임의 BGG ID
 *     responses:
 *       200:
 *         description: 번역 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         description: 게임을 찾을 수 없음
 */
router.post('/:bggId/translate', gameController.translateGame); // 인증 제거 (관리자 수동 번역)

/**
 * @swagger
 * /api/v1/games/translate-batch:
 *   post:
 *     summary: 여러 게임 일괄 번역
 *     description: 여러 게임을 한번에 번역합니다. (관리자용, 인증 불필요)
 *     tags: [Games - Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameIds
 *             properties:
 *               gameIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 번역할 게임들의 내부 ID 배열
 *                 example: [1, 2, 3, 4, 5]
 *     responses:
 *       200:
 *         description: 번역 배치 시작
 */
router.post(
  '/translate-batch',
  validateRequest(['gameIds']),
  gameController.translateGames
); // 인증 제거 (관리자 수동 번역)

export default router;

