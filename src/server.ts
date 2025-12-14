import app from './app';
import { env } from './config/env';
import { testConnection } from './config/database';
import { initScheduler } from './services/schedulerService';
import { runMigrations } from './config/migrate';
import { initializeGameData } from './services/gameInitService';

// 서버 시작
const startServer = async (): Promise<void> => {
  try {
    // 데이터베이스 연결 테스트
    await testConnection();

    // 마이그레이션 자동 실행
    await runMigrations();

    // 인기 게임 데이터 초기화 (백그라운드)
    initializeGameData();

    // 스케줄러 초기화
    initScheduler();

    // 서버 시작
    app.listen(env.port, () => {
      console.log(`🚀 MeepleOn Server is running on port ${env.port}`);
      console.log(`📝 Environment: ${env.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${env.port}/health`);
      console.log(`🌐 API endpoint: http://localhost:${env.port}/api/v1`);
      console.log(`📚 API Docs: http://localhost:${env.port}/api-docs`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 수신. 서버 종료 중...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호 수신. 서버 종료 중...');
  process.exit(0);
});

