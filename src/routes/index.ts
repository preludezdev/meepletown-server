import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import listingRoutes from './listingRoutes';
import homeRoutes from './homeRoutes';

const router = Router();

// API v1 라우터 통합
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/home', homeRoutes);

export default router;
