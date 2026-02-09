import * as gameRepository from '../repositories/gameRepository';
import * as papagoService from './papagoService';

// 번역 배치 작업 실행 (일일 자동 실행)
export const runTranslationBatch = async (dailyLimit: number = 2): Promise<void> => {
  console.log(`[번역 배치] 시작: 일일 ${dailyLimit}개 게임 번역`);

  try {
    // 1. 번역되지 않은 게임 중 우선순위 상위 N개 조회
    const untranslatedGames = await gameRepository.findUntranslatedGames(dailyLimit);

    if (untranslatedGames.length === 0) {
      console.log('[번역 배치] 번역할 게임이 없습니다');
      return;
    }

    console.log(`[번역 배치] ${untranslatedGames.length}개 게임 번역 시작`);

    // 2. 각 게임 번역
    for (const game of untranslatedGames) {
      try {
        await translateGame(game.id);
        console.log(`[번역 배치] 게임 번역 완료: ${game.nameEn} (ID: ${game.id})`);
        
        // Rate limit 방지 (1초 대기)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`[번역 배치] 게임 번역 실패: ${game.nameEn} (ID: ${game.id})`, error.message);
      }
    }

    console.log('[번역 배치] 완료');
  } catch (error: any) {
    console.error('[번역 배치] 에러:', error.message);
    throw error;
  }
};

// 단일 게임 번역
export const translateGame = async (gameId: number): Promise<void> => {
  const game = await gameRepository.findGameById(gameId);

  if (!game) {
    throw new Error(`게임을 찾을 수 없습니다 (ID: ${gameId})`);
  }

  console.log(`[게임 번역] 시작: ${game.nameEn} (ID: ${gameId})`);

  let totalCharacters = 0;
  let nameKo = game.nameKo;
  let descriptionKo = game.descriptionKo;

  // 1. 제목 번역 (아직 번역 안된 경우)
  if (!nameKo && game.nameEn) {
    console.log(`[게임 번역] 제목 번역 중: ${game.nameEn}`);
    nameKo = await papagoService.translateGameName(game.nameEn);
    totalCharacters += game.nameEn.length;
  }

  // 2. 설명 번역 (아직 번역 안된 경우)
  if (!descriptionKo && game.description) {
    console.log(`[게임 번역] 설명 번역 중 (${game.description.length}자)`);
    const result = await papagoService.translateGameDescription(game.description);
    descriptionKo = result.translatedText;
    totalCharacters += result.characterCount;
  }

  // 3. DB 업데이트
  await gameRepository.updateTranslation(gameId, nameKo || undefined, descriptionKo || undefined);

  // 4. 번역 통계 업데이트
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  await gameRepository.updateTranslationStats(currentMonth, totalCharacters, 1);

  console.log(`[게임 번역] 완료: ${nameKo} (총 ${totalCharacters}자)`);
};

// 여러 게임 일괄 번역
export const translateGames = async (gameIds: number[]): Promise<void> => {
  console.log(`[일괄 번역] 시작: ${gameIds.length}개 게임`);

  for (const gameId of gameIds) {
    try {
      await translateGame(gameId);
      // Rate limit 방지 (1초 대기)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`[일괄 번역] 게임 번역 실패 (ID: ${gameId})`, error.message);
    }
  }

  console.log('[일괄 번역] 완료');
};

// 인기도 점수 재계산 (주기적 실행)
export const recalculatePopularityScores = async (): Promise<void> => {
  console.log('[인기도 점수] 전체 재계산 시작');

  try {
    await gameRepository.updateAllPopularityScores();
    console.log('[인기도 점수] 재계산 완료');
  } catch (error: any) {
    console.error('[인기도 점수] 재계산 실패:', error.message);
    throw error;
  }
};

// 번역 대기열 조회
export const getTranslationQueue = async (limit: number = 50): Promise<any[]> => {
  const untranslatedGames = await gameRepository.findUntranslatedGames(limit);

  return untranslatedGames.map((game, index) => ({
    rank: index + 1,
    gameId: game.id,
    bggId: game.bggId,
    nameEn: game.nameEn,
    nameKo: game.nameKo,
    hasDescriptionKo: !!game.descriptionKo,
    popularityScore: game.popularityScore,
    owned: game.owned,
    wishing: game.wishing,
    bggRankOverall: game.bggRankOverall,
  }));
};

// 월별 번역 통계 조회
export const getMonthlyStats = async (yearMonth?: string): Promise<any> => {
  const targetMonth = yearMonth || new Date().toISOString().slice(0, 7);
  return await gameRepository.getTranslationStats(targetMonth);
};
