/**
 * boardgames_ranks.csv에서 is_expansion=0 필터, 상위 20000개 추출
 * 출력: id,name,rank 형식의 boardgames_ranks_top20000.csv
 *
 * 실행: npx ts-node scripts/generate-top20000.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const INPUT = path.join(__dirname, '../boardgames_ranks.csv');
const OUTPUT = path.join(__dirname, '../src/data/boardgames_ranks_top20000.csv');
const LIMIT = 20000;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || c === '\n') {
      result.push(current.trim());
      current = '';
      if (c === '\n') break;
    } else {
      current += c;
    }
  }
  if (current.length) result.push(current.trim());
  return result;
}

const content = fs.readFileSync(INPUT, 'utf-8');
const lines = content.split(/\r?\n/);
const header = lines[0];
const cols = header.split(',');
const rankIdx = cols.indexOf('rank');
const isExpansionIdx = cols.indexOf('is_expansion');
const idIdx = cols.indexOf('id');
const nameIdx = cols.indexOf('name');

if (rankIdx === -1 || isExpansionIdx === -1) {
  console.error('필요한 컬럼을 찾을 수 없습니다');
  process.exit(1);
}

const rows: { id: string; name: string; rank: number }[] = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  const cells = parseCsvLine(line);
  const isExpansion = cells[isExpansionIdx];
  if (isExpansion !== '0') continue;
  const rank = parseInt(cells[rankIdx], 10);
  if (isNaN(rank) || rank < 1) continue;
  const id = cells[idIdx] || '';
  const name = (cells[nameIdx] || '').replace(/"/g, '""');
  rows.push({ id, name: `"${name}"`, rank });
}

rows.sort((a, b) => a.rank - b.rank);
const top = rows.slice(0, LIMIT);

const outLines = ['id,name,rank', ...top.map((r) => `${r.id},${r.name},${r.rank}`)];
fs.writeFileSync(OUTPUT, outLines.join('\n'), 'utf-8');
console.log(`✅ ${OUTPUT} 생성 완료 (${top.length}개)`);
