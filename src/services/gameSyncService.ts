import { fetchGameFromBGG } from './bggService';
import * as gameRepository from '../repositories/gameRepository';
import { Game } from '../models/Game';

// BGG에서 게임 데이터 가져와서 DB에 저장/업데이트
export const syncGameFromBGG = async (bggId: number): Promise<Game> => {
  // BGG API에서 게임 정보 가져오기
  const bggGameData = await fetchGameFromBGG(bggId);

  if (!bggGameData) {
    throw new Error(`BGG에서 게임 정보를 찾을 수 없습니다 (bggId: ${bggId})`);
  }

  // 기존 게임 확인
  let game = await gameRepository.findGameByBggId(bggId);

  if (game) {
    // 기존 게임 업데이트
    game = await gameRepository.updateGame(game.id, bggGameData);
  } else {
    // 새 게임 생성
    game = await gameRepository.createGame(bggGameData);
  }

  // 카테고리 매핑 업데이트
  if (bggGameData.categories && bggGameData.categories.length > 0) {
    await gameRepository.deleteCategoryMappingsByGameId(game.id);
    
    for (const category of bggGameData.categories) {
      const categoryRecord = await gameRepository.findOrCreateCategory(
        category.id,
        category.name
      );
      await gameRepository.createGameCategoryMapping(game.id, categoryRecord.id);
    }
  }

  // 메커니즘 매핑 업데이트
  if (bggGameData.mechanisms && bggGameData.mechanisms.length > 0) {
    await gameRepository.deleteMechanismMappingsByGameId(game.id);
    
    for (const mechanism of bggGameData.mechanisms) {
      const mechanismRecord = await gameRepository.findOrCreateMechanism(
        mechanism.id,
        mechanism.name
      );
      await gameRepository.createGameMechanismMapping(game.id, mechanismRecord.id);
    }
  }

  return game;
};

// 여러 게임 동기화
export const syncGamesFromBGG = async (bggIds: number[]): Promise<Game[]> => {
  const games: Game[] = [];

  for (const bggId of bggIds) {
    try {
      const game = await syncGameFromBGG(bggId);
      games.push(game);
      console.log(`✅ 게임 동기화 완료: ${game.nameEn} (bggId: ${bggId})`);
    } catch (error: any) {
      console.error(`❌ 게임 동기화 실패 (bggId: ${bggId}):`, error.message);
      // 에러 발생해도 계속 진행
    }
  }

  return games;
};

// 게임이 DB에 없으면 동기화, 있으면 기존 데이터 반환
export const getOrSyncGame = async (bggId: number): Promise<Game> => {
  let game = await gameRepository.findGameByBggId(bggId);

  if (!game) {
    console.log(`게임이 DB에 없습니다. BGG에서 동기화 시작 (bggId: ${bggId})`);
    game = await syncGameFromBGG(bggId);
  }

  return game;
};

