import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export type BatchSource = 'hot' | 'csv';

export interface BatchSettings {
  enabled: boolean;
  /** 단일 hour는 하위호환용. hours 사용 권장 */
  hour: number;
  /** 실행 시각(0~23) 배열. 복수 선택 시 해당 시각마다 배치 실행 */
  hours: number[];
  size: number;
  source: BatchSource;
  requestDelayMs: number;
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
  const [enabledVal, hourVal, hoursVal, sizeVal, sourceVal, delayVal] = await Promise.all([
    getSetting('bgg_batch_enabled'),
    getSetting('bgg_batch_hour'),
    getSetting('bgg_batch_hours'),
    getSetting('bgg_batch_size'),
    getSetting('bgg_batch_source'),
    getSetting('bgg_request_delay_ms'),
  ]);

  const source: BatchSource = sourceVal === 'hot' ? 'hot' : 'csv';
  const maxSize = source === 'csv' ? 1000 : 50;
  const requestDelayMs = Math.min(3000, Math.max(500, parseInt(delayVal || '1500', 10) || 1500));

  const defaultHour = Math.min(23, Math.max(0, parseInt(hourVal || '3', 10) || 3));
  let hours: number[];
  if (hoursVal && hoursVal.trim()) {
    hours = hoursVal
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 23);
    if (hours.length === 0) hours = [defaultHour];
  } else {
    hours = [defaultHour];
  }

  return {
    enabled: enabledVal === 'true',
    hour: hours[0] ?? defaultHour,
    hours,
    size: Math.min(maxSize, Math.max(1, parseInt(sizeVal || '50', 10) || 50)),
    source,
    requestDelayMs,
  };
};

// BGG 배치 설정 수정
export const updateBatchSettings = async (updates: {
  enabled?: boolean;
  hour?: number;
  hours?: number[];
  size?: number;
  source?: BatchSource;
  requestDelayMs?: number;
}): Promise<void> => {
  const tasks: Promise<void>[] = [];

  if (updates.enabled !== undefined) {
    tasks.push(setSetting('bgg_batch_enabled', updates.enabled ? 'true' : 'false'));
  }
  if (updates.hours !== undefined && updates.hours.length > 0) {
    const valid = updates.hours
      .map((h) => Math.min(23, Math.max(0, h)))
      .filter((h, i, arr) => arr.indexOf(h) === i)
      .sort((a, b) => a - b);
    tasks.push(setSetting('bgg_batch_hours', valid.join(',')));
    tasks.push(setSetting('bgg_batch_hour', String(valid[0]))); // 하위호환
  } else if (updates.hour !== undefined) {
    const h = Math.min(23, Math.max(0, updates.hour));
    tasks.push(setSetting('bgg_batch_hour', String(h)));
    tasks.push(setSetting('bgg_batch_hours', String(h)));
  }
  if (updates.size !== undefined) {
    const s = Math.min(1000, Math.max(1, updates.size));
    tasks.push(setSetting('bgg_batch_size', String(s)));
  }
  if (updates.source !== undefined && (updates.source === 'hot' || updates.source === 'csv')) {
    tasks.push(setSetting('bgg_batch_source', updates.source));
  }
  if (updates.requestDelayMs !== undefined) {
    const d = Math.min(3000, Math.max(500, updates.requestDelayMs));
    tasks.push(setSetting('bgg_request_delay_ms', String(d)));
  }

  await Promise.all(tasks);
};
