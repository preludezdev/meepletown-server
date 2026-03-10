import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import * as adminPostController from '../controllers/adminPostController';
import * as adminBatchController from '../controllers/adminBatchController';
import { adminAuth } from '../middlewares/adminMiddleware';

const router = Router();

router.get('/stats', adminAuth, adminController.getStats);
router.get('/dump-game-data', adminAuth, adminController.dumpGameData);
router.post('/restore-game-data', adminAuth, adminController.restoreGameData);
router.get('/batch-settings', adminAuth, adminBatchController.getBatchSettings);
router.patch('/batch-settings', adminAuth, adminBatchController.updateBatchSettings);
router.post('/batch-settings/run-now', adminAuth, adminBatchController.runBatchNow);
router.get('/posts', adminAuth, adminPostController.getPosts);
router.delete('/posts/:id', adminAuth, adminPostController.deletePost);

export default router;
