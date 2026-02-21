import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { adminAuth } from '../middlewares/adminMiddleware';

const router = Router();

router.get('/stats', adminAuth, adminController.getStats);

export default router;
