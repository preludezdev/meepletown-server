import * as gameRepository from '../repositories/gameRepository';
import * as gameRatingRepository from '../repositories/gameRatingRepository';
import { getOrSyncGame } from './gameSyncService';
import { GameDetailResponse } from '../models/Game';
import { GameRatingWithUser, CreateGameRatingRequest, UpdateGameRatingRequest } from '../models/GameRating';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

// 게임 상세 조회 (BGG 데이터 + 미플온 평점)
export const getGameDetail = async (
  bggId: number,
  userId?: number
): Promise<GameDetailResponse> => {
  // 게임 정보 가져오기 (없으면 BGG에서 동기화)
  const game = await getOrSyncGame(bggId);

  // 카테고리 및 메커니즘 조회
  const categories = await gameRepository.findCategoriesByGameId(game.id);
  const mechanisms = await gameRepository.findMechanismsByGameId(game.id);

  // 사용자가 로그인한 경우, 해당 사용자의 평가 조회
  let userRating = null;
  if (userId) {
    userRating = await gameRatingRepository.findRatingByUserAndGame(userId, game.id);
  }

  const response: GameDetailResponse = {
    id: game.id,
    bggId: game.bggId,
    nameKo: game.nameKo,
    nameEn: game.nameEn,
    alternateNames: game.alternateNames ? JSON.parse(game.alternateNames) : null,
    yearPublished: game.yearPublished,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    bestPlayerCount: game.bestPlayerCount,
    minPlaytime: game.minPlaytime,
    maxPlaytime: game.maxPlaytime,
    minAge: game.minAge,
    description: game.description,
    imageUrl: game.imageUrl,
    thumbnailUrl: game.thumbnailUrl,
    
    // 제작진 정보 (JSON 파싱)
    designers: game.designers ? JSON.parse(game.designers) : null,
    artists: game.artists ? JSON.parse(game.artists) : null,
    publishers: game.publishers ? JSON.parse(game.publishers) : null,
    
    // 평점/통계
    bggRating: game.bggRating,
    averageWeight: game.averageWeight,
    meepleonRating: game.meepleonRating,
    ratingCount: game.ratingCount,
    usersRated: game.usersRated,
    
    // 커뮤니티 통계
    owned: game.owned,
    trading: game.trading,
    wanting: game.wanting,
    wishing: game.wishing,
    numComments: game.numComments,
    numWeights: game.numWeights,
    
    // 랭킹
    bggRankOverall: game.bggRankOverall,
    bggRankStrategy: game.bggRankStrategy,
    
    categories,
    mechanisms,
    userRating,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };

  return response;
};

// 게임 평가 목록 조회
export const getGameRatings = async (
  bggId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<GameRatingWithUser[]> => {
  const game = await gameRepository.findGameByBggId(bggId);
  if (!game) {
    throw new NotFoundError('게임을 찾을 수 없습니다');
  }

  return await gameRatingRepository.findRatingsByGameId(game.id, page, pageSize);
};

// 게임 평가 등록
export const createGameRating = async (
  userId: number,
  bggId: number,
  ratingData: CreateGameRatingRequest
): Promise<GameRatingWithUser> => {
  // 평점 유효성 검사
  if (ratingData.rating < 0 || ratingData.rating > 10) {
    throw new BadRequestError('평점은 0에서 10 사이여야 합니다');
  }

  // 게임 정보 가져오기
  const game = await getOrSyncGame(bggId);

  // 이미 평가한 게임인지 확인
  const existingRating = await gameRatingRepository.findRatingByUserAndGame(userId, game.id);
  if (existingRating) {
    throw new BadRequestError('이미 평가한 게임입니다. 수정을 원하시면 PATCH를 사용하세요');
  }

  // 평가 생성
  const rating = await gameRatingRepository.createRating(
    userId,
    game.id,
    ratingData.rating,
    ratingData.comment || null
  );

  // 게임의 평균 평점 업데이트
  const { average, count } = await gameRatingRepository.calculateAverageRating(game.id);
  await gameRepository.updateGameRating(game.id, average, count);

  // 사용자 정보와 함께 반환
  const ratings = await gameRatingRepository.findRatingsByGameId(game.id, 1, 1);
  const ratingWithUser = ratings.find((r) => r.id === rating.id);

  if (!ratingWithUser) {
    throw new Error('평가 생성 후 조회 실패');
  }

  return ratingWithUser;
};

// 게임 평가 수정
export const updateGameRating = async (
  userId: number,
  ratingId: number,
  ratingData: UpdateGameRatingRequest
): Promise<GameRatingWithUser> => {
  // 평가 존재 여부 확인
  const existingRating = await gameRatingRepository.findRatingById(ratingId);
  if (!existingRating) {
    throw new NotFoundError('평가를 찾을 수 없습니다');
  }

  // 권한 확인
  if (existingRating.userId !== userId) {
    throw new ForbiddenError('본인의 평가만 수정할 수 있습니다');
  }

  // 평점 유효성 검사
  if (ratingData.rating !== undefined && (ratingData.rating < 0 || ratingData.rating > 10)) {
    throw new BadRequestError('평점은 0에서 10 사이여야 합니다');
  }

  // 평가 수정
  const updatedRating = await gameRatingRepository.updateRating(
    ratingId,
    ratingData.rating !== undefined ? ratingData.rating : null,
    ratingData.comment !== undefined ? ratingData.comment : null
  );

  // 게임의 평균 평점 업데이트
  const { average, count } = await gameRatingRepository.calculateAverageRating(existingRating.gameId);
  await gameRepository.updateGameRating(existingRating.gameId, average, count);

  // 사용자 정보와 함께 반환
  const ratings = await gameRatingRepository.findRatingsByGameId(existingRating.gameId, 1, 100);
  const ratingWithUser = ratings.find((r) => r.id === updatedRating.id);

  if (!ratingWithUser) {
    throw new Error('평가 수정 후 조회 실패');
  }

  return ratingWithUser;
};

// 게임 평가 삭제
export const deleteGameRating = async (userId: number, ratingId: number): Promise<void> => {
  // 평가 존재 여부 확인
  const existingRating = await gameRatingRepository.findRatingById(ratingId);
  if (!existingRating) {
    throw new NotFoundError('평가를 찾을 수 없습니다');
  }

  // 권한 확인
  if (existingRating.userId !== userId) {
    throw new ForbiddenError('본인의 평가만 삭제할 수 있습니다');
  }

  const gameId = existingRating.gameId;

  // 평가 삭제
  await gameRatingRepository.deleteRating(ratingId);

  // 게임의 평균 평점 업데이트
  const { average, count } = await gameRatingRepository.calculateAverageRating(gameId);
  await gameRepository.updateGameRating(gameId, average, count);
};

