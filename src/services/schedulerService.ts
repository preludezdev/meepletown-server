import cron from 'node-cron';
import { env } from '../config/env';
import { fetchHotGamesFromBGG } from './bggService';
import { syncGamesFromBGG } from './gameSyncService';
import { recalculatePopularityScores } from './translationBatchService';

// BGG Hot List 동기화 작업
const syncHotGames = async () => {
  console.log('🔄 BGG Hot List 동기화 시작...');
  try {
    // BGG에서 인기 게임 목록 가져오기
    const hotGameIds = await fetchHotGamesFromBGG();
    
    if (hotGameIds.length === 0) {
      console.log('⚠️ BGG Hot List가 비어있습니다');
      return;
    }

    console.log(`📋 BGG Hot List: ${hotGameIds.length}개 게임 발견`);
    
    // 게임 동기화 (최대 50개만)
    const idsToSync = hotGameIds.slice(0, 50);
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

// 스케줄러 초기화
export const initScheduler = () => {
  if (env.disableBggCron) {
    console.log(`[SCHEDULER] APP_ENV=${env.appEnv} / DISABLE_BGG_CRON=true → BGG 크론 비활성화`);
    return;
  }

  // 매일 새벽 3시에 BGG Hot List 동기화
  cron.schedule('0 3 * * *', syncHotGames, {
    timezone: 'Asia/Seoul',
  });

  // 매주 일요일 새벽 4시에 인기도 점수 재계산 (향후 자동화 시 사용)
  cron.schedule('0 4 * * 0', recalculateScores, {
    timezone: 'Asia/Seoul',
  });

  console.log('⏰ 스케줄러 초기화 완료');
  console.log('  - 매일 03:00: BGG Hot List 동기화');
  console.log('  - 매주 일요일 04:00: 인기도 점수 재계산');
};

// 즉시 실행 (테스트용)
export const runSyncNow = async () => {
  await syncHotGames();
};

export const runScoreRecalculationNow = async () => {
  await recalculateScores();
};
