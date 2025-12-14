import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import listingRoutes from './listingRoutes';
import homeRoutes from './homeRoutes';
import gameRoutes from './gameRoutes';

const router = Router();

// API v1 라우터 통합
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/home', homeRoutes);
router.use('/games', gameRoutes);

export default router;
