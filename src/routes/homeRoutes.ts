import { Router } from 'express';
import * as homeController from '../controllers/homeController';

const router = Router();

// 오늘의 매물 조회 - 비로그인 허용
router.get('/today-listings', homeController.getTodayListings);

export default router;

