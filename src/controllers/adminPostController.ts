import { Request, Response, NextFunction } from 'express';
import * as adminPostService from '../services/adminPostService';
import { sendSuccess } from '../utils/response';
import { BoardType, PostCategory } from '../models/Post';
import { AdminPostFilter } from '../repositories/adminPostRepository';

// 어드민 포럼 글 목록
export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const boardType = req.query.boardType as BoardType | undefined;
    const category = req.query.category as PostCategory | undefined;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.pageSize), 10) || 20)
    );
    const includeDraft = req.query.includeDraft === 'true';
    const search = req.query.search as string | undefined;

    const filter: AdminPostFilter = {
      boardType,
      category,
      includeDraft,
      search,
    };

    const result = await adminPostService.getPostsForAdmin(
      filter,
      page,
      pageSize
    );
    sendSuccess(res, { ...result, page, pageSize });
  } catch (error) {
    next(error);
  }
};

// 어드민 포럼 글 삭제
export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: '유효하지 않은 글 ID입니다' },
      });
      return;
    }
    await adminPostService.deletePostByAdmin(id);
    sendSuccess(res, { deleted: true, id });
  } catch (error) {
    next(error);
  }
};
