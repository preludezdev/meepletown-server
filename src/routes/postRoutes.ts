import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as postController from '../controllers/postController';

const router = Router();

// 포럼 글 목록 조회 - 비로그인 허용
// GET /api/v1/posts?boardType=game_forum&category=리뷰&gameId=1&page=1&pageSize=20
router.get('/', postController.getPosts);

// 내 글 목록 (임시저장 포함) - 인증 필요
router.get('/me', authenticate, postController.getMyPosts);

// 내 임시저장 글 상세 조회 - 인증 필요
router.get('/me/:id', authenticate, postController.getMyDraft);

// 포럼 글 상세 조회 - 비로그인 허용
router.get('/:id', postController.getPostById);

// 포럼 글 생성 - 인증 필요
router.post('/', authenticate, postController.createPost);

// 포럼 글 수정 - 인증 필요
router.patch('/:id', authenticate, postController.updatePost);

// 포럼 글 삭제 - 인증 필요
router.delete('/:id', authenticate, postController.deletePost);

export default router;
