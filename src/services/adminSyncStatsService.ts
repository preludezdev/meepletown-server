import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { loadTopRankedGamesFromCsv } from '../data/bggTopRankedIds';

export interface SyncStats {
  totalGames: number;
  syncedInTop20000: number;
  highestRankCompleted: number;
}

export const getSyncStats = async (): Promise<SyncStats> => {
  const [gameRows] = await pool.execute<RowDataPacket[]>(
    'SELECT bggId FROM games'
  );
  const dbBggIds = new Set((gameRows as { bggId: number }[]).map((r) => r.bggId));

  const csvGames = await loadTopRankedGamesFromCsv(20000);
  if (csvGames.length === 0) {
    return {
      totalGames: dbBggIds.size,
      syncedInTop20000: 0,
      highestRankCompleted: 0,
    };
  }

  let syncedInTop20000 = 0;
  let highestRankCompleted = 0;

  for (const g of csvGames) {
    if (dbBggIds.has(g.bggId)) {
      syncedInTop20000++;
      highestRankCompleted = g.rank;
    } else {
      break; // 연속 끊김 = 이 rank부터 미동기화
    }
  }

  const [countRows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM games'
  );
  const totalGames = Number((countRows[0] as any)?.total ?? 0);

  return {
    totalGames,
    syncedInTop20000,
    highestRankCompleted,
  };
};
