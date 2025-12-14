import { Request, Response, NextFunction } from 'express';
import * as gameService from '../services/gameService';
import * as gameSyncService from '../services/gameSyncService';
import { sendSuccess } from '../utils/response';

// 게임 상세 조회
export const getGameDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bggId = parseInt(req.params.bggId);
    const userId = (req as any).user?.userId; // 로그인한 경우에만

    const gameDetail = await gameService.getGameDetail(bggId, userId);
    sendSuccess(res, gameDetail);
  } catch (error) {
    next(error);
  }
};

// 게임 평가 목록 조회
export const getGameRatings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bggId = parseInt(req.params.bggId);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const ratings = await gameService.getGameRatings(bggId, page, pageSize);
    sendSuccess(res, { ratings, page, pageSize });
  } catch (error) {
    next(error);
  }
};

// 게임 평가 등록
export const createGameRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bggId = parseInt(req.params.bggId);
    const userId = (req as any).user?.userId;
    const { rating, comment } = req.body;

    const newRating = await gameService.createGameRating(userId, bggId, {
      rating,
      comment,
    });
    sendSuccess(res, newRating, 201);
  } catch (error) {
    next(error);
  }
};

// 게임 평가 수정
export const updateGameRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ratingId = parseInt(req.params.ratingId);
    const userId = (req as any).user?.userId;
    const { rating, comment } = req.body;

    const updatedRating = await gameService.updateGameRating(userId, ratingId, {
      rating,
      comment,
    });
    sendSuccess(res, updatedRating);
  } catch (error) {
    next(error);
  }
};

// 게임 평가 삭제
export const deleteGameRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ratingId = parseInt(req.params.ratingId);
    const userId = (req as any).user?.userId;

    await gameService.deleteGameRating(userId, ratingId);
    sendSuccess(res, { message: '평가가 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
};

// 게임 동기화 (수동 실행, 관리자용)
export const syncGame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bggId = parseInt(req.params.bggId);
    const game = await gameSyncService.syncGameFromBGG(bggId);
    sendSuccess(res, game);
  } catch (error) {
    next(error);
  }
};

// 여러 게임 동기화 (수동 실행, 관리자용)
export const syncGames = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bggIds } = req.body; // [174430, 167791, ...]
    
    if (!Array.isArray(bggIds)) {
      return next(new Error('bggIds는 배열이어야 합니다'));
    }

    const games = await gameSyncService.syncGamesFromBGG(bggIds);
    sendSuccess(res, { 
      message: `${games.length}개 게임 동기화 완료`,
      games 
    });
  } catch (error) {
    next(error);
  }
};

