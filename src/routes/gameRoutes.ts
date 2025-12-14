import { Router } from 'express';
import * as gameController from '../controllers/gameController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// 게임 상세 조회 (비로그인 허용)
router.get('/:bggId', gameController.getGameDetail);

// 게임 평가 목록 조회 (비로그인 허용)
router.get('/:bggId/ratings', gameController.getGameRatings);

// 게임 평가 등록 (인증 필요)
router.post(
  '/:bggId/ratings',
  authenticate,
  validateRequest(['rating']),
  gameController.createGameRating
);

// 게임 평가 수정 (인증 필요)
router.patch(
  '/:bggId/ratings/:ratingId',
  authenticate,
  gameController.updateGameRating
);

// 게임 평가 삭제 (인증 필요)
router.delete(
  '/:bggId/ratings/:ratingId',
  authenticate,
  gameController.deleteGameRating
);

// 게임 동기화 (수동 실행)
router.post('/sync/:bggId', authenticate, gameController.syncGame);

// 여러 게임 동기화 (수동 실행)
router.post(
  '/sync',
  authenticate,
  validateRequest(['bggIds']),
  gameController.syncGames
);

export default router;

