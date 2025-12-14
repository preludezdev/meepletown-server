import { syncGamesFromBGG } from './gameSyncService';
import { findGameByBggId } from '../repositories/gameRepository';

// 초기 동기화할 인기 게임 목록 (BGG ID)
const POPULAR_GAMES = [
  174430, // 글룸헤이븐 (Gloomhaven)
  167791, // 테라포밍 마스 (Terraforming Mars)
  233078, // 아컴호러: 카드게임 (Arkham Horror: The Card Game)
  220308, // 기즈모 (Gizmos)
  266192, // 윙스팬 (Wingspan)
  182028, // 카탄의 개척자 (Catan)
  13,     // 카탄 (Catan)
  36218,  // 도미니언 (Dominion)
  68448,  // 7 Wonders
  30549,  // 팬데믹 (Pandemic)
];

// 초기 게임 데이터 동기화
export const initializeGameData = async () => {
  try {
    console.log('🎮 인기 게임 데이터 초기화 시작...');

    // 이미 동기화된 게임 확인
    const gamesToSync: number[] = [];
    
    for (const bggId of POPULAR_GAMES) {
      const existingGame = await findGameByBggId(bggId);
      if (!existingGame) {
        gamesToSync.push(bggId);
      }
    }

    if (gamesToSync.length === 0) {
      console.log('✅ 모든 인기 게임이 이미 동기화되어 있습니다.');
      return;
    }

    console.log(`📥 ${gamesToSync.length}개 게임 동기화 시작...`);
    
    // 백그라운드로 동기화 (서버 시작 차단하지 않음)
    syncGamesFromBGG(gamesToSync)
      .then(() => {
        console.log('✅ 인기 게임 데이터 동기화 완료!');
      })
      .catch((error) => {
        console.error('❌ 게임 데이터 동기화 실패:', error.message);
      });

    console.log('🔄 백그라운드에서 게임 동기화 진행 중...');
  } catch (error) {
    console.error('❌ 게임 데이터 초기화 실패:', error);
    // 에러 발생해도 서버는 계속 실행
  }
};

