import { Router } from 'express';
import * as userController from '../controllers/userController';
import * as listingController from '../controllers/listingController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// 내 매물 목록 조회 (인증 필요)
router.get('/me/listings', authenticate, listingController.getMyListings);

// 사용자 조회 - 비로그인 허용
router.get('/:id', userController.getUserById);

export default router;
