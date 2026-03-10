import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import * as adminPostController from '../controllers/adminPostController';
import { adminAuth } from '../middlewares/adminMiddleware';

const router = Router();

router.get('/stats', adminAuth, adminController.getStats);
router.get('/dump-game-data', adminAuth, adminController.dumpGameData);
router.get('/posts', adminAuth, adminPostController.getPosts);
router.delete('/posts/:id', adminAuth, adminPostController.deletePost);

export default router;
