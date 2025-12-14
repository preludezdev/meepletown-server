import cron from 'node-cron';
import { fetchHotGamesFromBGG } from './bggService';
import { syncGamesFromBGG } from './gameSyncService';

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

// 스케줄러 초기화
export const initScheduler = () => {
  // 매일 새벽 3시에 BGG Hot List 동기화
  cron.schedule('0 3 * * *', syncHotGames, {
    timezone: 'Asia/Seoul',
  });

  console.log('⏰ 스케줄러 초기화 완료 (매일 새벽 3시 BGG Hot List 동기화)');
};

// 즉시 실행 (테스트용)
export const runSyncNow = async () => {
  await syncHotGames();
};

