import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface BatchSettings {
  enabled: boolean;
  hour: number;
  size: number;
}

// 단일 설정 조회
export const getSetting = async (key: string): Promise<string | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT value FROM settings WHERE `key` = ?',
    [key]
  );
  const row = rows[0];
  return row?.value != null ? String(row.value) : null;
};

// 단일 설정 저장
export const setSetting = async (key: string, value: string): Promise<void> => {
  await pool.execute<ResultSetHeader>(
    'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
    [key, value]
  );
};

// BGG 배치 설정 조회
export const getBatchSettings = async (): Promise<BatchSettings> => {
  const [enabledVal, hourVal, sizeVal] = await Promise.all([
    getSetting('bgg_batch_enabled'),
    getSetting('bgg_batch_hour'),
    getSetting('bgg_batch_size'),
  ]);

  return {
    enabled: enabledVal === 'true',
    hour: Math.min(23, Math.max(0, parseInt(hourVal || '3', 10) || 3)),
    size: Math.min(100, Math.max(1, parseInt(sizeVal || '50', 10) || 50)),
  };
};

// BGG 배치 설정 수정
export const updateBatchSettings = async (updates: {
  enabled?: boolean;
  hour?: number;
  size?: number;
}): Promise<void> => {
  const tasks: Promise<void>[] = [];

  if (updates.enabled !== undefined) {
    tasks.push(setSetting('bgg_batch_enabled', updates.enabled ? 'true' : 'false'));
  }
  if (updates.hour !== undefined) {
    const h = Math.min(23, Math.max(0, updates.hour));
    tasks.push(setSetting('bgg_batch_hour', String(h)));
  }
  if (updates.size !== undefined) {
    const s = Math.min(100, Math.max(1, updates.size));
    tasks.push(setSetting('bgg_batch_size', String(s)));
  }

  await Promise.all(tasks);
};
