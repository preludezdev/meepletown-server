import cron from 'node-cron';
import { env } from '../config/env';
import { fetchHotGamesFromBGG } from './bggService';
import { syncGamesFromBGG } from './gameSyncService';
import { recalculatePopularityScores } from './translationBatchService';
import * as settingsRepository from '../repositories/settingsRepository';

// BGG Hot List 동기화 (DB 설정 기반)
const syncHotGames = async (): Promise<void> => {
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

    console.log('🔄 BGG Hot List 동기화 시작...');
    const hotGameIds = await fetchHotGamesFromBGG();

    if (hotGameIds.length === 0) {
      console.log('⚠️ BGG Hot List가 비어있습니다');
      return;
    }

    console.log(`📋 BGG Hot List: ${hotGameIds.length}개 게임 발견`);
    const idsToSync = hotGameIds.slice(0, settings.size);
    await syncGamesFromBGG(idsToSync);

    console.log('✅ BGG Hot List 동기화 완료');
  } catch (error: any) {
    console.error('❌ BGG Hot List 동기화 실패:', error.message);
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
  cron.schedule('0 * * * *', syncHotGames, {
    timezone: 'Asia/Seoul',
  });

  // 매주 일요일 새벽 4시에 인기도 점수 재계산 (향후 자동화 시 사용)
  cron.schedule('0 4 * * 0', recalculateScores, {
    timezone: 'Asia/Seoul',
  });

  console.log('⏰ 스케줄러 초기화 완료');
  console.log('  - 매시 0분: BGG Hot List 동기화 (설정 시각에 실행)');
  console.log('  - 매주 일요일 04:00: 인기도 점수 재계산');
};

// 즉시 실행 (어드민 API용, DB 설정 반영)
export const runSyncNow = async (): Promise<void> => {
  const settings = await settingsRepository.getBatchSettings();
  if (!settings.enabled) {
    throw new Error('배치가 비활성화되어 있습니다. 운영 탭에서 활성화해주세요.');
  }

  console.log('🔄 BGG Hot List 수동 동기화 시작...');
  const hotGameIds = await fetchHotGamesFromBGG();
  if (hotGameIds.length === 0) {
    throw new Error('BGG Hot List가 비어있습니다');
  }
  const idsToSync = hotGameIds.slice(0, settings.size);
  await syncGamesFromBGG(idsToSync);
  console.log('✅ BGG Hot List 수동 동기화 완료');
};

export const runScoreRecalculationNow = async () => {
  await recalculateScores();
};
