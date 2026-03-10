/**
 * 게임 데이터 SQL 덤프 생성 (스테이징 마이그레이션용)
 * games, gameCategories, gameMechanisms, 매핑 테이블, translationStats
 */
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const DUMP_TABLES = [
  'gameCategories',
  'gameMechanisms',
  'games',
  'gameCategoryMappings',
  'gameMechanismMappings',
  'translationStats',
] as const;

const BATCH_SIZE = 100; // 대용량 테이블용 INSERT 배치 크기

function escapeSql(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (val instanceof Date) return pool.escape(val);
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  return pool.escape(val);
}

function buildInsertStatement(tableName: string, rows: RowDataPacket[], columns: string[]): string {
  if (rows.length === 0) return '';

  const colList = columns.map((c) => '`' + c + '`').join(', ');
  const lines: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch
      .map(
        (row) =>
          '(' +
          columns.map((col) => escapeSql((row as Record<string, unknown>)[col])).join(', ') +
          ')'
      )
      .join(',\n  ');
    lines.push(`INSERT INTO \`${tableName}\` (${colList}) VALUES\n  ${values};`);
  }

  return lines.join('\n\n') + (lines.length ? '\n' : '');
}

export const generateGameDataDump = async (): Promise<string> => {
  const conn = await pool.getConnection();
  const chunks: string[] = [];

  try {
    chunks.push('-- MeepleOn 게임 데이터 덤프');
    chunks.push(`-- 생성일시: ${new Date().toISOString()}`);
    chunks.push('-- 스테이징 마이그레이션용: 이 파일 실행 전에 스테이징 DB가 스키마는 있어야 함\n');
    chunks.push('SET FOREIGN_KEY_CHECKS=0;\n');
    chunks.push('-- 기존 데이터 비우기 (복원 전 실행)');
    chunks.push(
      'TRUNCATE gameMechanismMappings;\nTRUNCATE gameCategoryMappings;\nTRUNCATE games;\nTRUNCATE gameMechanisms;\nTRUNCATE gameCategories;\nTRUNCATE translationStats;\n'
    );

    for (const tableName of DUMP_TABLES) {
      const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM \`${tableName}\``);
      const arr = Array.isArray(rows) ? rows : [];
      const columns = arr.length > 0 ? Object.keys(arr[0] as object) : [];
      const sql = buildInsertStatement(tableName, arr, columns);
      if (sql) {
        chunks.push(`-- ${tableName} (${arr.length} rows)`);
        chunks.push(sql);
      }
    }

    chunks.push('SET FOREIGN_KEY_CHECKS=1;');
    return chunks.join('\n');
  } finally {
    conn.release();
  }
};
