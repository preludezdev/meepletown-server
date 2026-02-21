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
// CSV 파일: src/data/boardgames_ranks_top3000.csv (BGG 공식 데이터 덤프에서 추출)
// 업데이트 방법: BGG(boardgamegeek.com/data_dumps/bg_ranks)에서 새 CSV 다운로드 후
//   python3로 rank 1~3000, is_expansion=0 필터링 → boardgames_ranks_top3000.csv 교체
export const loadTopRankedIdsFromCsv = async (limit: number = 3000): Promise<number[]> => {
  const games = await loadTopRankedGamesFromCsv(limit);
  return games.map((g) => g.bggId);
};

// 랭킹 정보(id + name + rank) 포함 버전
export const loadTopRankedGamesFromCsv = async (limit: number = 3000): Promise<BggRankedGame[]> => {
  const csvPath = path.join(__dirname, 'boardgames_ranks_top3000.csv');

  if (!fs.existsSync(csvPath)) {
    console.warn('[BGG 랭킹] CSV 파일이 없습니다:', csvPath);
    return [];
  }

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
      if (parsed && parsed.rank >= 1 && parsed.rank <= limit) {
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
