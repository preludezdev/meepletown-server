import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendSuccess, sendError } from '../utils/response';
import {
  getPostsService,
  getPostByIdService,
  getMyPostsService,
  getMyDraftService,
  createPostService,
  updatePostService,
  deletePostService,
} from '../services/postService';
import { BoardType, PostCategory, PostFilter } from '../models/Post';

// 포럼 글 목록 조회
export const getPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

    const filter: PostFilter = {};
    if (req.query.boardType) filter.boardType = req.query.boardType as BoardType;
    if (req.query.gameId) filter.gameId = parseInt(req.query.gameId as string, 10);
    if (req.query.category) filter.category = req.query.category as PostCategory;

    const result = await getPostsService(filter, page, pageSize);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// 포럼 글 상세 조회
export const getPostById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'BAD_REQUEST', '유효하지 않은 ID입니다', 400);
      return;
    }
    const post = await getPostByIdService(id);
    sendSuccess(res, post);
  } catch (error) {
    next(error);
  }
};

// 내 글 목록 (임시저장 포함)
export const getMyPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }
    const posts = await getMyPostsService(userId);
    sendSuccess(res, posts);
  } catch (error) {
    next(error);
  }
};

// 내 임시저장 글 상세 조회
export const getMyDraft = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'BAD_REQUEST', '유효하지 않은 ID입니다', 400);
      return;
    }
    const post = await getMyDraftService(id, userId);
    sendSuccess(res, post);
  } catch (error) {
    next(error);
  }
};

// 포럼 글 생성
export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }

    const { boardType, gameId, category, title, contentBlocks, isDraft } = req.body;

    if (!boardType || !category || !title || !contentBlocks) {
      sendError(res, 'BAD_REQUEST', 'boardType, category, title, contentBlocks는 필수입니다', 400);
      return;
    }
    if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
      sendError(res, 'BAD_REQUEST', 'contentBlocks는 비어있지 않은 배열이어야 합니다', 400);
      return;
    }

    const post = await createPostService(userId, {
      boardType,
      gameId,
      category,
      title,
      contentBlocks,
      isDraft: isDraft ?? false,
    });

    sendSuccess(res, post, 201);
  } catch (error) {
    next(error);
  }
};

// 포럼 글 수정
export const updatePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'BAD_REQUEST', '유효하지 않은 ID입니다', 400);
      return;
    }

    const post = await updatePostService(id, userId, req.body);
    sendSuccess(res, post);
  } catch (error) {
    next(error);
  }
};

// 포럼 글 삭제
export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'BAD_REQUEST', '유효하지 않은 ID입니다', 400);
      return;
    }

    await deletePostService(id, userId);
    sendSuccess(res, { message: '게시글이 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
};
