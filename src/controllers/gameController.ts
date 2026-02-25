import { Request, Response, NextFunction } from 'express';
import * as gameService from '../services/gameService';
import * as gameSyncService from '../services/gameSyncService';
import * as translationBatchService from '../services/translationBatchService';
import * as taxonomyTranslationService from '../services/taxonomyTranslationService';
import * as gameRepository from '../repositories/gameRepository';
import { loadTopRankedGamesFromCsv } from '../data/bggTopRankedIds';
import { sendSuccess } from '../utils/response';

// 게임 목록 조회 (어드민용)
export const getGamesList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const translated = req.query.translated as 'all' | 'yes' | 'no' | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 30;

    const result = await gameService.getGamesList({ search, translated, page, pageSize });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// 게임 검색 (공개) - GET /api/v1/games/search?q=keyword&limit=10
export const searchGames = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const results = await gameService.searchGames(q, limit);
    sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
};

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

// 단일 게임 번역 (수동 실행, 관리자용)
export const translateGame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bggId = parseInt(req.params.bggId);

    // BGG ID로 게임 찾기
    const game = await gameRepository.findGameByBggId(bggId);
    if (!game) {
      return next(new Error('게임을 찾을 수 없습니다'));
    }

    // 게임 번역 실행
    await translationBatchService.translateGame(game.id);

    // 번역된 게임 다시 조회
    const translatedGame = await gameRepository.findGameById(game.id);

    sendSuccess(res, {
      message: `게임 번역 완료: ${translatedGame?.nameKo || game.nameEn}`,
      game: translatedGame,
    });
  } catch (error) {
    next(error);
  }
};

// 여러 게임 일괄 번역 (수동 실행, 관리자용)
export const translateGames = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gameIds } = req.body; // [1, 2, 3, ...]

    if (!Array.isArray(gameIds)) {
      return next(new Error('gameIds는 배열이어야 합니다'));
    }

    // 백그라운드 작업으로 실행
    translationBatchService
      .translateGames(gameIds)
      .catch((error) => console.error('[일괄 번역 에러]', error));

    sendSuccess(res, {
      message: `${gameIds.length}개 게임 번역을 시작했습니다`,
    });
  } catch (error) {
    next(error);
  }
};

// 번역 대기열 조회
export const getTranslationQueue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const queue = await translationBatchService.getTranslationQueue(limit);

    sendSuccess(res, {
      total: queue.length,
      queue,
    });
  } catch (error) {
    next(error);
  }
};

// 월별 번역 통계 조회
export const getTranslationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const yearMonth = req.query.yearMonth as string;
    const stats = await translationBatchService.getMonthlyStats(yearMonth);

    sendSuccess(res, stats || {
      message: '번역 통계가 없습니다',
      yearMonth: yearMonth || new Date().toISOString().slice(0, 7),
    });
  } catch (error) {
    next(error);
  }
};

// BGG 랭킹 상위 게임 일괄 동기화 + 번역 (관리자용)
export const syncAndTranslateBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bggIds, startRank, endRank, charLimit, dryRun } = req.body;

    // bggIds 유효성 검사 (선택값)
    if (bggIds !== undefined && !Array.isArray(bggIds)) {
      return next(new Error('bggIds는 배열이어야 합니다'));
    }

    const result = await translationBatchService.syncAndTranslateBatch({
      bggIds: bggIds as number[] | undefined,
      startRank: startRank as number | undefined,
      endRank: endRank as number | undefined,
      charLimit: charLimit as number | undefined,
      dryRun: dryRun as boolean | undefined,
    });

    sendSuccess(res, {
      message: dryRun
        ? `[DryRun] 번역 계획: ${result.translated}개 게임, ${result.totalCharsUsed}자 예상`
        : `동기화+번역 완료: ${result.translated}개 게임 번역됨`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// 카테고리 목록 조회 (관리자용)
export const listCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await taxonomyTranslationService.getCategoriesStatus();
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// 카테고리 nameKo 수동 수정 (관리자용)
export const updateCategoryNameKo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { nameKo } = req.body;

    if (!nameKo || typeof nameKo !== 'string') {
      return next(new Error('nameKo는 필수 문자열입니다'));
    }

    await gameRepository.updateCategoryNameKo(id, nameKo);
    sendSuccess(res, { message: '카테고리 한국어 이름이 수정되었습니다', id, nameKo });
  } catch (error) {
    next(error);
  }
};

// 카테고리 자동 번역 배치 실행 (관리자용)
export const translateCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    taxonomyTranslationService
      .translateAllCategories()
      .then((result) => console.log('[카테고리 번역 배치 완료]', result))
      .catch((error) => console.error('[카테고리 번역 배치 오류]', error));

    sendSuccess(res, { message: '카테고리 번역 배치를 시작했습니다' });
  } catch (error) {
    next(error);
  }
};

// 메커니즘 목록 조회 (관리자용)
export const listMechanisms = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await taxonomyTranslationService.getMechanismsStatus();
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// 메커니즘 nameKo 수동 수정 (관리자용)
export const updateMechanismNameKo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { nameKo } = req.body;

    if (!nameKo || typeof nameKo !== 'string') {
      return next(new Error('nameKo는 필수 문자열입니다'));
    }

    await gameRepository.updateMechanismNameKo(id, nameKo);
    sendSuccess(res, { message: '메커니즘 한국어 이름이 수정되었습니다', id, nameKo });
  } catch (error) {
    next(error);
  }
};

// 메커니즘 자동 번역 배치 실행 (관리자용)
export const translateMechanisms = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    taxonomyTranslationService
      .translateAllMechanisms()
      .then((result) => console.log('[메커니즘 번역 배치 완료]', result))
      .catch((error) => console.error('[메커니즘 번역 배치 오류]', error));

    sendSuccess(res, { message: '메커니즘 번역 배치를 시작했습니다' });
  } catch (error) {
    next(error);
  }
};

// BGG 랭킹 상위 게임 목록 + 번역 상태 조회 (관리자용)
export const getTopRankedStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rankedGames = await loadTopRankedGamesFromCsv(3000);

    const statusList = await Promise.all(
      rankedGames.map(async ({ bggId, name, rank }) => {
        const game = await gameRepository.findGameByBggId(bggId);
        return {
          bggId,
          csvRank: rank,
          csvName: name,
          inDb: !!game,
          nameEn: game?.nameEn ?? null,
          nameKo: game?.nameKo ?? null,
          hasDescriptionKo: !!game?.descriptionKo,
          bggRankOverall: game?.bggRankOverall ?? null,
        };
      })
    );

    const inDb = statusList.filter((g) => g.inDb).length;
    const translated = statusList.filter((g) => g.hasDescriptionKo).length;
    const notInDb = statusList.filter((g) => !g.inDb).length;
    const notTranslated = statusList.filter((g) => g.inDb && !g.hasDescriptionKo).length;

    sendSuccess(res, {
      summary: {
        total: rankedGames.length,
        inDb,
        notInDb,
        translated,
        notTranslated,
      },
      games: statusList,
    });
  } catch (error) {
    next(error);
  }
};
