import { Router } from 'express';
import * as gameController from '../controllers/gameController';
import { authenticate } from '../middlewares/authMiddleware';
import { adminAuth } from '../middlewares/adminMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

/**
 * @swagger
 * /api/v1/games/top-ranked-status:
 *   get:
 *     summary: BGG 상위 랭킹 게임 번역 상태 조회
 *     description: BGG 상위 랭킹 게임 목록과 각 게임의 DB 존재 여부 및 번역 상태를 조회합니다. (인증 필요)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     inDb:
 *                       type: integer
 *                     notInDb:
 *                       type: integer
 *                     translated:
 *                       type: integer
 *                     notTranslated:
 *                       type: integer
 *                 games:
 *                   type: array
 *       401:
 *         description: 인증 필요
 */
router.get('/top-ranked-status', adminAuth, gameController.getTopRankedStatus);

/**
 * @swagger
 * /api/v1/games/sync-and-translate:
 *   post:
 *     summary: BGG 상위 랭킹 게임 일괄 동기화 + 번역
 *     description: |
 *       BGG 랭킹 상위 게임들을 순서대로 동기화하고 번역합니다. (인증 필요, 비용 발생)
 *       - 이미 DB에 없는 게임은 BGG에서 자동 동기화
 *       - 이미 번역된 게임(descriptionKo 있음)은 스킵
 *       - 누적 글자 수가 월 한도(기본 900,000자)를 초과하면 자동 중단
 *       - dryRun=true 로 실제 번역 없이 계획만 미리 확인 가능
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bggIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 처리할 BGG ID 목록 (생략 시 서버 내 BGG_TOP_RANKED_IDS 목록 사용)
 *                 example: [174430, 167791, 342942]
 *               charLimit:
 *                 type: integer
 *                 description: 이번 배치의 최대 글자 수 한도 (기본 900,000자)
 *                 example: 900000
 *               dryRun:
 *                 type: boolean
 *                 description: true 이면 실제 번역 없이 계획만 반환 (비용 없음)
 *                 example: false
 *     responses:
 *       200:
 *         description: 배치 처리 완료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 processed:
 *                   type: integer
 *                 synced:
 *                   type: integer
 *                 translated:
 *                   type: integer
 *                 skippedAlreadyTranslated:
 *                   type: integer
 *                 stoppedByLimit:
 *                   type: boolean
 *                 totalCharsUsed:
 *                   type: integer
 *                 remainingBudget:
 *                   type: integer
 *                 details:
 *                   type: array
 *       401:
 *         description: 인증 필요
 */
router.post('/sync-and-translate', adminAuth, gameController.syncAndTranslateBatch);

/**
 * @swagger
 * /api/v1/games/translation-queue:
 *   get:
 *     summary: 번역 대기열 조회
 *     description: 번역되지 않은 게임 목록을 우선순위순으로 조회합니다. (인증 필요)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: 인증 필요
 */
router.get('/translation-queue', adminAuth, gameController.getTranslationQueue);

/**
 * @swagger
 * /api/v1/games/translation-stats:
 *   get:
 *     summary: 월별 번역 통계 조회
 *     description: 특정 월의 번역 문자 수, 게임 수, 예상 비용을 조회합니다. (인증 필요)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: 인증 필요
 */
router.get('/translation-stats', adminAuth, gameController.getTranslationStats);

/**
 * @swagger
 * /api/v1/games:
 *   get:
 *     summary: 게임 목록 조회 (어드민)
 *     description: 게임 목록을 검색/필터/페이지네이션으로 조회합니다. (어드민 인증 필요)
 *     tags: [Games - Admin]
 *     security:
 *       - adminKey: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 게임명 검색 (nameEn / nameKo)
 *       - in: query
 *         name: translated
 *         schema:
 *           type: string
 *           enum: [all, yes, no]
 *           default: all
 *         description: 번역 상태 필터
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 100
 *     responses:
 *       200:
 *         description: 게임 목록 조회 성공
 *       401:
 *         description: 어드민 인증 필요
 */
router.get('/', adminAuth, gameController.getGamesList);

/**
 * @swagger
 * /api/v1/games/search:
 *   get:
 *     summary: 게임 검색 (자동완성/추천)
 *     description: 게임 이름(한국어/영어)으로 검색하여 추천 결과를 반환합니다.
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색 키워드
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 20
 *         description: 최대 결과 수
 *     responses:
 *       200:
 *         description: 검색 결과
 */
router.get('/search', gameController.searchGames);

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
 *     description: 특정 게임의 설명을 Papago API로 번역합니다. (관리자용, 인증 필요 - 비용 발생)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 게임을 찾을 수 없음
 */
router.post('/:bggId/translate', adminAuth, gameController.translateGame);

/**
 * @swagger
 * /api/v1/games/translate-batch:
 *   post:
 *     summary: 여러 게임 일괄 번역
 *     description: 여러 게임을 한번에 번역합니다. (관리자용, 인증 필요 - 비용 발생)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: 번역 배치 시작
 *       401:
 *         description: 인증 필요
 */
router.post(
  '/translate-batch',
  adminAuth,
  validateRequest(['gameIds']),
  gameController.translateGames
);

/**
 * @swagger
 * /api/v1/games/admin/categories:
 *   get:
 *     summary: 카테고리 목록 조회
 *     description: 전체 카테고리 목록과 번역 상태를 조회합니다. (관리자용)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 */
router.get('/admin/categories', adminAuth, gameController.listCategories);

/**
 * @swagger
 * /api/v1/games/admin/categories/{id}:
 *   patch:
 *     summary: 카테고리 한국어 이름 수정
 *     description: 특정 카테고리의 nameKo를 수동으로 수정합니다. (관리자용)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - nameKo
 *             properties:
 *               nameKo:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 */
router.patch('/admin/categories/:id', adminAuth, gameController.updateCategoryNameKo);

/**
 * @swagger
 * /api/v1/games/admin/translate-categories:
 *   post:
 *     summary: 카테고리 자동 번역 배치 실행
 *     description: nameKo가 없는 카테고리를 Papago로 일괄 번역합니다. (관리자용, 비용 발생)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 배치 시작
 */
router.post('/admin/translate-categories', adminAuth, gameController.translateCategories);

/**
 * @swagger
 * /api/v1/games/admin/mechanisms:
 *   get:
 *     summary: 메커니즘 목록 조회
 *     description: 전체 메커니즘 목록과 번역 상태를 조회합니다. (관리자용)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 */
router.get('/admin/mechanisms', adminAuth, gameController.listMechanisms);

/**
 * @swagger
 * /api/v1/games/admin/mechanisms/{id}:
 *   patch:
 *     summary: 메커니즘 한국어 이름 수정
 *     description: 특정 메커니즘의 nameKo를 수동으로 수정합니다. (관리자용)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - nameKo
 *             properties:
 *               nameKo:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 */
router.patch('/admin/mechanisms/:id', adminAuth, gameController.updateMechanismNameKo);

/**
 * @swagger
 * /api/v1/games/admin/translate-mechanisms:
 *   post:
 *     summary: 메커니즘 자동 번역 배치 실행
 *     description: nameKo가 없는 메커니즘을 Papago로 일괄 번역합니다. (관리자용, 비용 발생)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 배치 시작
 */
router.post('/admin/translate-mechanisms', adminAuth, gameController.translateMechanisms);

/**
 * @swagger
 * /api/v1/games/admin/migrate-korean-names:
 *   post:
 *     summary: alternateNames → nameKo 한국어 이름 일괄 마이그레이션
 *     description: nameKo가 없는 게임 중 alternateNames에 한국어가 있는 경우 자동으로 nameKo를 채웁니다. (관리자용)
 *     tags: [Games - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 마이그레이션 완료
 */
router.post('/admin/migrate-korean-names', adminAuth, gameController.migrateKoreanNames);

export default router;

