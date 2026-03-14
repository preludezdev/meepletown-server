import cron from 'node-cron';
import { env } from '../config/env';
import { fetchHotGamesFromBGG } from './bggService';
import { syncGamesFromBGG } from './gameSyncService';
import { recalculatePopularityScores } from './translationBatchService';
import { getSyncStats } from './adminSyncStatsService';
import { loadTopRankedIdsFromCsv } from '../data/bggTopRankedIds';
import * as settingsRepository from '../repositories/settingsRepository';

// BGG 배치 동기화 (DB 설정 기반, Hot List 또는 CSV 랭킹)
const syncBggBatch = async (): Promise<void> => {
  try {
    const settings = await settingsRepository.getBatchSettings();
    if (!settings.enabled) {
      return;
    }

    const now = new Date();
    const kstHour = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })).getHours();
    if (kstHour !== settings.hour) {
      return;
    }

    let idsToSync: number[];

    if (settings.source === 'csv') {
      const stats = await getSyncStats();
      if (stats.highestRankCompleted >= 20000) {
        console.log('✅ 상위 2만 랭킹 동기화 완료 (추가 작업 없음)');
        return;
      }
      const fromRank = stats.highestRankCompleted;
      idsToSync = await loadTopRankedIdsFromCsv(settings.size, fromRank);
      if (idsToSync.length === 0) {
        console.log('⚠️ CSV 랭킹에서 게임을 찾을 수 없습니다 (boardgames_ranks_top3000.csv 확인)');
        return;
      }
      console.log(`🔄 BGG CSV 랭킹 동기화 시작 (${fromRank + 1}~${fromRank + idsToSync.length}위, ${idsToSync.length}개)`);
    } else {
      const hotGameIds = await fetchHotGamesFromBGG();
      if (hotGameIds.length === 0) {
        console.log('⚠️ BGG Hot List가 비어있습니다');
        return;
      }
      idsToSync = hotGameIds.slice(0, settings.size);
      console.log(`🔄 BGG Hot List 동기화 시작`);
      console.log(`📋 Hot List: ${idsToSync.length}개 게임`);
    }

    await syncGamesFromBGG(idsToSync, { delayMs: settings.requestDelayMs });
    console.log('✅ BGG 배치 동기화 완료');
  } catch (error: any) {
    console.error('❌ BGG 배치 동기화 실패:', error.message);
  }
};

// 인기도 점수 재계산 작업 (주 1회, 향후 자동화 시 사용)
const recalculateScores = async () => {
  console.log('📊 인기도 점수 재계산 시작...');
  try {
    await recalculatePopularityScores();
    console.log('✅ 인기도 점수 재계산 완료');
  } catch (error: any) {
    console.error('❌ 인기도 점수 재계산 실패:', error.message);
  }
};

// 스케줄러 초기화 (프로덕션에서만 배치 동작)
export const initScheduler = () => {
  if (!env.enableBggCron || !env.isProduction) {
    console.log(`[SCHEDULER] 배치 비활성화 (ENABLE_BGG_CRON=false 또는 production 아님, appEnv=${env.appEnv})`);
    return;
  }

  // 매시 0분에 실행, DB 설정에 따라 실제 동기화 여부 결정
  cron.schedule('0 * * * *', syncBggBatch, {
    timezone: 'Asia/Seoul',
  });

  // 매주 일요일 새벽 4시에 인기도 점수 재계산 (향후 자동화 시 사용)
  cron.schedule('0 4 * * 0', recalculateScores, {
    timezone: 'Asia/Seoul',
  });

  console.log('⏰ 스케줄러 초기화 완료');
  console.log('  - 매시 0분: BGG 배치 동기화 (Hot List 또는 CSV, 설정 시각에 실행)');
  console.log('  - 매주 일요일 04:00: 인기도 점수 재계산');
};

// 즉시 실행 (어드민 API용, DB 설정 반영)
// onProgress: 진행률 콜백 (프로그레스바용, API에서는 백그라운드 실행 시 전달)
export const runSyncNow = async (opts?: {
  onProgress?: (current: number, total: number) => void;
}): Promise<void> => {
  const settings = await settingsRepository.getBatchSettings();
  if (!settings.enabled) {
    throw new Error('배치가 비활성화되어 있습니다. 운영 탭에서 활성화해주세요.');
  }

  let idsToSync: number[];

  if (settings.source === 'csv') {
    const stats = await getSyncStats();
    if (stats.highestRankCompleted >= 20000) {
      throw new Error('상위 2만 랭킹 동기화가 이미 완료되었습니다.');
    }
    const fromRank = stats.highestRankCompleted;
    idsToSync = await loadTopRankedIdsFromCsv(settings.size, fromRank);
    if (idsToSync.length === 0) {
      throw new Error('CSV 랭킹에서 게임을 찾을 수 없습니다 (boardgames_ranks_top3000.csv 확인)');
    }
    console.log(`🔄 BGG CSV 랭킹 수동 동기화 시작 (${fromRank + 1}~${fromRank + idsToSync.length}위, ${idsToSync.length}개)`);
  } else {
    const hotGameIds = await fetchHotGamesFromBGG();
    if (hotGameIds.length === 0) {
      throw new Error('BGG Hot List가 비어있습니다');
    }
    idsToSync = hotGameIds.slice(0, settings.size);
    console.log('🔄 BGG Hot List 수동 동기화 시작...');
  }

  await syncGamesFromBGG(idsToSync, {
    delayMs: settings.requestDelayMs,
    onProgress: opts?.onProgress,
  });
  console.log('✅ BGG 배치 수동 동기화 완료');
};

export const runScoreRecalculationNow = async () => {
  await recalculateScores();
};
