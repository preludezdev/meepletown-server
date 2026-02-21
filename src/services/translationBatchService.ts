import * as gameRepository from '../repositories/gameRepository';
import * as gameSyncService from './gameSyncService';
import * as papagoService from './papagoService';
import { loadTopRankedIdsFromCsv } from '../data/bggTopRankedIds';

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
  let descriptionKo = game.descriptionKo;

  // 설명 번역 (아직 번역 안된 경우만)
  if (!descriptionKo && game.description) {
    console.log(`[게임 번역] 설명 번역 중 (${game.description.length}자)`);
    const result = await papagoService.translateGameDescription(game.description);
    descriptionKo = result.translatedText;
    totalCharacters += result.characterCount;
  }

  // DB 업데이트 (descriptionKo만)
  await gameRepository.updateTranslation(gameId, undefined, descriptionKo || undefined);

  // 4. 번역 통계 업데이트
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  await gameRepository.updateTranslationStats(currentMonth, totalCharacters, 1);

  console.log(`[게임 번역] 완료: ${game.nameEn} (총 ${totalCharacters}자)`);
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

// BGG 랭킹 상위 게임 일괄 동기화 + 번역
// - 이미 DB에 없는 게임은 BGG에서 동기화
// - 이미 번역된 게임은 스킵 (descriptionKo가 있으면 패스)
// - 누적 글자 수가 월 한도(90% = 900,000자)를 초과하면 중단
export const syncAndTranslateBatch = async (options?: {
  bggIds?: number[];       // 직접 지정 시 이 목록 사용, 없으면 CSV에서 상위 1200개 로드
  charLimit?: number;      // 이번 배치의 최대 글자 수 (기본: 남은 월 한도)
  dryRun?: boolean;        // true면 실제 번역 없이 계획만 반환
}): Promise<{
  processed: number;
  synced: number;
  translated: number;
  skippedAlreadyTranslated: number;
  stoppedByLimit: boolean;
  totalCharsUsed: number;
  remainingBudget: number;
  details: Array<{
    bggId: number;
    nameEn: string;
    action: 'translated' | 'skipped_translated' | 'skipped_limit' | 'sync_failed' | 'translate_failed';
    chars?: number;
  }>;
}> => {
  const MONTHLY_SAFE_LIMIT = 900000; // 90% of 1,000,000자 (Papago 1 billing unit)
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 이번 달 누적 사용량 조회
  const currentStats = await gameRepository.getTranslationStats(currentMonth);
  const alreadyUsed = currentStats?.totalCharacters || 0;
  const monthlyBudget = options?.charLimit ?? MONTHLY_SAFE_LIMIT;
  let remainingBudget = Math.max(0, monthlyBudget - alreadyUsed);

  const targetIds = options?.bggIds ?? await loadTopRankedIdsFromCsv(1200);
  const dryRun = options?.dryRun ?? false;

  console.log(`[동기화+번역 배치] 시작: ${targetIds.length}개 게임 대상`);
  console.log(`[동기화+번역 배치] 이번달 누적 사용: ${alreadyUsed}자 / 한도: ${monthlyBudget}자 / 남은 예산: ${remainingBudget}자`);

  const result = {
    processed: 0,
    synced: 0,
    translated: 0,
    skippedAlreadyTranslated: 0,
    stoppedByLimit: false,
    totalCharsUsed: 0,
    remainingBudget,
    details: [] as Array<{
      bggId: number;
      nameEn: string;
      action: 'translated' | 'skipped_translated' | 'skipped_limit' | 'sync_failed' | 'translate_failed';
      chars?: number;
    }>,
  };

  for (const bggId of targetIds) {
    result.processed++;

    // 1. DB에서 게임 조회 (없으면 BGG에서 동기화)
    let game = await gameRepository.findGameByBggId(bggId);

    if (!game) {
      try {
        console.log(`[동기화+번역 배치] BGG 동기화 중: bggId=${bggId}`);
        game = await gameSyncService.syncGameFromBGG(bggId);
        result.synced++;
        // BGG API rate limit 방지
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error: any) {
        console.error(`[동기화+번역 배치] 동기화 실패: bggId=${bggId}`, error.message);
        result.details.push({ bggId, nameEn: `bggId:${bggId}`, action: 'sync_failed' });
        continue;
      }
    }

    // 2. 이미 번역된 게임 스킵
    if (game.descriptionKo) {
      console.log(`[동기화+번역 배치] 이미 번역됨, 스킵: ${game.nameEn}`);
      result.skippedAlreadyTranslated++;
      result.details.push({ bggId, nameEn: game.nameEn, action: 'skipped_translated' });
      continue;
    }

    // 3. 번역할 글자 수 예측 (description 길이)
    if (!game.description) {
      console.log(`[동기화+번역 배치] description 없음, 스킵: ${game.nameEn}`);
      result.skippedAlreadyTranslated++;
      result.details.push({ bggId, nameEn: game.nameEn, action: 'skipped_translated' });
      continue;
    }

    const estimatedChars = game.description.length;

    // 4. 예산 초과 체크
    if (estimatedChars > remainingBudget) {
      console.warn(`[동기화+번역 배치] 예산 초과로 중단: ${game.nameEn} (예상 ${estimatedChars}자 > 남은 ${remainingBudget}자)`);
      result.stoppedByLimit = true;
      result.details.push({ bggId, nameEn: game.nameEn, action: 'skipped_limit', chars: estimatedChars });
      break;
    }

    // 5. 번역 실행 (dryRun이면 스킵)
    if (dryRun) {
      console.log(`[동기화+번역 배치] [DryRun] 번역 예정: ${game.nameEn} (${estimatedChars}자)`);
      remainingBudget -= estimatedChars;
      result.totalCharsUsed += estimatedChars;
      result.translated++;
      result.details.push({ bggId, nameEn: game.nameEn, action: 'translated', chars: estimatedChars });
      continue;
    }

    try {
      console.log(`[동기화+번역 배치] 번역 시작: ${game.nameEn} (${estimatedChars}자)`);
      const translationResult = await papagoService.translateGameDescription(game.description);
      await gameRepository.updateTranslation(game.id, undefined, translationResult.translatedText);

      const usedChars = translationResult.characterCount;
      await gameRepository.updateTranslationStats(currentMonth, usedChars, 1);

      remainingBudget -= usedChars;
      result.totalCharsUsed += usedChars;
      result.translated++;
      result.details.push({ bggId, nameEn: game.nameEn, action: 'translated', chars: usedChars });

      console.log(`[동기화+번역 배치] 번역 완료: ${game.nameEn} (${usedChars}자 사용, 남은 예산: ${remainingBudget}자)`);

      // Papago API rate limit 방지
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`[동기화+번역 배치] 번역 실패: ${game.nameEn}`, error.message);
      result.details.push({ bggId, nameEn: game.nameEn, action: 'translate_failed' });
    }
  }

  result.remainingBudget = remainingBudget;

  console.log(`[동기화+번역 배치] 완료: 처리=${result.processed}, 동기화=${result.synced}, 번역=${result.translated}, 스킵=${result.skippedAlreadyTranslated}, 한도초과중단=${result.stoppedByLimit}`);

  return result;
};
