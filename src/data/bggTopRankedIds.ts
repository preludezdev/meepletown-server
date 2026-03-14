import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export interface BggRankedGame {
  bggId: number;
  name: string;
  rank: number;
}

// CSV 한 줄 파싱: "id,name_possibly_quoted,rank" 형식
// 게임 이름에 쉼표가 포함될 수 있으므로 첫/마지막 쉼표 기준으로 분리
const parseCsvLine = (line: string): { id: number; name: string; rank: number } | null => {
  const firstComma = line.indexOf(',');
  const lastComma = line.lastIndexOf(',');

  if (firstComma === -1 || firstComma === lastComma) return null;

  const id = parseInt(line.substring(0, firstComma).trim(), 10);
  const rank = parseInt(line.substring(lastComma + 1).trim(), 10);
  const name = line.substring(firstComma + 1, lastComma).replace(/^"|"$/g, '');

  if (isNaN(id) || isNaN(rank)) return null;
  return { id, name, rank };
};

// BGG 랭킹 CSV 파일에서 상위 N개 게임 ID를 읽어 rank 순으로 반환
// fromRank: 이전까지 완료된 랭킹. 지정 시 (fromRank+1)~(fromRank+limit) 구간 로드
// CSV: boardgames_ranks_top3000.csv (1~3000), boardgames_ranks_top20000.csv (1~20000)
export const loadTopRankedIdsFromCsv = async (
  limit: number = 3000,
  fromRank?: number
): Promise<number[]> => {
  const games = await loadTopRankedGamesFromCsv(limit, fromRank);
  return games.map((g) => g.bggId);
};

// 랭킹 정보(id + name + rank) 포함 버전
// limit > 3000 이면 top20000.csv 사용, else top3000.csv
// fromRank: 지정 시 (fromRank+1)~(fromRank+limit) 구간만 반환 (이어서 동기화용)
export const loadTopRankedGamesFromCsv = async (
  limit: number = 3000,
  fromRank?: number
): Promise<BggRankedGame[]> => {
  const needTop20000 = limit > 3000 || ((fromRank ?? 0) + limit > 3000);
  const csvName = needTop20000 ? 'boardgames_ranks_top20000.csv' : 'boardgames_ranks_top3000.csv';
  const csvPath = path.join(__dirname, csvName);

  if (!fs.existsSync(csvPath)) {
    console.warn('[BGG 랭킹] CSV 파일이 없습니다:', csvPath);
    return [];
  }

  const csvMax = csvName.includes('20000') ? 20000 : 3000;
  const minRank = fromRank != null ? fromRank + 1 : 1;
  const maxRank =
    fromRank != null
      ? Math.min(fromRank + limit, csvMax)
      : Math.min(limit, csvMax);

  return new Promise((resolve, reject) => {
    const games: BggRankedGame[] = [];

    const rl = readline.createInterface({
      input: fs.createReadStream(csvPath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    let isHeader = true;

    rl.on('line', (line) => {
      if (isHeader) {
        isHeader = false;
        return;
      }

      const parsed = parseCsvLine(line);
      if (parsed && parsed.rank >= minRank && parsed.rank <= maxRank) {
        games.push({ bggId: parsed.id, name: parsed.name, rank: parsed.rank });
      }
    });

    rl.on('close', () => {
      games.sort((a, b) => a.rank - b.rank);
      resolve(games);
    });

    rl.on('error', (err) => {
      console.error('[BGG 랭킹] CSV 파싱 에러:', err.message);
      reject(err);
    });
  });
};
