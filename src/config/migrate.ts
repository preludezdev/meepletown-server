import fs from 'fs';
import path from 'path';
import pool from './database';

// 마이그레이션 추적 테이블 생성
const createMigrationsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(createTableQuery);
};

// 이미 실행된 마이그레이션 확인
const getExecutedMigrations = async (): Promise<string[]> => {
  const [rows] = await pool.query('SELECT filename FROM schema_migrations');
  return (rows as any[]).map((row) => row.filename);
};

// 마이그레이션 실행 기록
const recordMigration = async (filename: string) => {
  await pool.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
};

// SQL 파일 실행 (여러 쿼리 분리해서 실행)
const executeSqlFile = async (filePath: string) => {
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // SQL 파일을 개별 쿼리로 분리 (세미콜론 기준, 주석 제거)
  const queries = sql
    .split(';')
    .map((query) => {
      // 주석 제거 (-- 또는 #로 시작하는 줄)
      return query
        .split('\n')
        .filter((line) => !line.trim().startsWith('--') && !line.trim().startsWith('#'))
        .join('\n')
        .trim();
    })
    .filter((query) => query.length > 0);

  // 각 쿼리 실행
  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (error: any) {
      // 테이블이 이미 존재하는 경우 등은 무시
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }
};

// 마이그레이션 실행
export const runMigrations = async () => {
  try {
    console.log('🔄 마이그레이션 시작...');

    // 마이그레이션 추적 테이블 생성
    await createMigrationsTable();

    // 실행된 마이그레이션 목록 가져오기
    const executedMigrations = await getExecutedMigrations();
    console.log(`✅ 이미 실행된 마이그레이션: ${executedMigrations.length}개`);

    // migrations 폴더의 SQL 파일 목록
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // 파일명 순서대로 정렬

    console.log(`📋 전체 마이그레이션 파일: ${migrationFiles.length}개`);

    // 실행되지 않은 마이그레이션만 실행
    for (const filename of migrationFiles) {
      if (executedMigrations.includes(filename)) {
        console.log(`⏭️  건너뛰기: ${filename} (이미 실행됨)`);
        continue;
      }

      console.log(`🚀 실행 중: ${filename}`);
      const filePath = path.join(migrationsDir, filename);
      
      try {
        await executeSqlFile(filePath);
        await recordMigration(filename);
        console.log(`✅ 완료: ${filename}`);
      } catch (error: any) {
        console.error(`❌ 실패: ${filename}`, error.message);
        throw error;
      }
    }

    console.log('✅ 마이그레이션 완료!');
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  }
};

