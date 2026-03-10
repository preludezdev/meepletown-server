/**
 * 게임 데이터 SQL 복원 (덤프 파일 업로드 → 현재 DB에 적용)
 * 외부에서 mysql 접속이 안 될 때 어드민에서 복원용
 */
import mysql from 'mysql2/promise';
import { env } from '../config/env';

export const restoreGameDataFromSql = async (sqlContent: string): Promise<{ ok: boolean; message: string }> => {
  // multipleStatements로 여러 쿼리 한 번에 실행
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    multipleStatements: true,
  });

  try {
    // 주석 제거 (-- 로 시작하는 줄)
    const cleaned = sqlContent
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    if (!cleaned) {
      return { ok: false, message: '실행할 SQL이 없습니다.' };
    }

    await conn.query(cleaned);
    return { ok: true, message: '게임 데이터 복원 완료.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `복원 실패: ${msg}` };
  } finally {
    await conn.end();
  }
};
