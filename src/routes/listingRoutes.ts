import { Router } from 'express';
import * as listingController from '../controllers/listingController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// 모든 Listing 조회 (필터, 정렬) - 비로그인 허용
router.get('/', listingController.getAllListings);

// Listing 상세 조회 - 비로그인 허용
router.get('/:id', listingController.getListingById);

// Listing 생성 (인증 필요)
router.post(
  '/',
  authenticate,
  validateRequest(['gameName', 'price', 'method']),
  listingController.createListing
);

// Listing 이미지 추가 (인증 필요)
router.post(
  '/:id/images',
  authenticate,
  validateRequest(['images']),
  listingController.addListingImages
);

// Listing 상태 변경 (인증 필요)
router.patch(
  '/:id/status',
  authenticate,
  validateRequest(['status']),
  listingController.updateListingStatus
);

// Listing 삭제 (인증 필요)
router.delete('/:id', authenticate, listingController.deleteListing);

export default router;
