import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { BggGameData } from '../models/Game';
import { env } from '../config/env';

const BGG_API_BASE_URL = 'https://boardgamegeek.com/xmlapi2';

// Axios 인스턴스 생성 (User-Agent + Authorization 설정)
const bggClient = axios.create({
  baseURL: BGG_API_BASE_URL,
  headers: {
    'User-Agent': 'MeepleOn/1.0 (+https://meepleon.com; contact@meepleon.com)',
    'Accept': 'application/xml',
    ...(env.bggApiToken && { 'Authorization': `Bearer ${env.bggApiToken}` }), // BGG 토큰 있으면 추가
  },
  timeout: 10000, // 10초 타임아웃
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
});

// BGG API 요청 간 딜레이 (Rate limit 방지)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// BGG API에서 게임 정보 가져오기
export const fetchGameFromBGG = async (bggId: number): Promise<BggGameData | null> => {
  try {
    // BGG XML API2: thing?id={bggId}&type=boardgame&stats=1
    const url = `/thing?id=${bggId}&type=boardgame&stats=1`;
    const response = await bggClient.get(url);

    // XML 파싱
    const parsed = parser.parse(response.data);
    const item = parsed?.items?.item;

    if (!item) {
      return null;
    }

    // 이름 추출 (primary name)
    const names = Array.isArray(item.name) ? item.name : [item.name];
    const primaryName = names.find((n: any) => n['@_type'] === 'primary');
    const nameEn = primaryName?.['@_value'] || item.name?.['@_value'] || 'Unknown';

    // 플레이어 수 추출
    const poll = Array.isArray(item.poll) ? item.poll : [item.poll];
    const playerCountPoll = poll.find((p: any) => p['@_name'] === 'suggested_numplayers');
    let bestPlayerCount: number | undefined;

    if (playerCountPoll?.results) {
      const results = Array.isArray(playerCountPoll.results)
        ? playerCountPoll.results
        : [playerCountPoll.results];
      
      // 가장 많은 "Best" 투표를 받은 플레이어 수 찾기
      let maxBestVotes = 0;
      results.forEach((r: any) => {
        const numPlayers = r['@_numplayers'];
        const votes = Array.isArray(r.result) ? r.result : [r.result];
        const bestVote = votes.find((v: any) => v['@_value'] === 'Best');
        const bestVoteCount = bestVote?.['@_numvotes'] || 0;
        
        if (bestVoteCount > maxBestVotes && !isNaN(parseInt(numPlayers))) {
          maxBestVotes = bestVoteCount;
          bestPlayerCount = parseInt(numPlayers);
        }
      });
    }

    // 카테고리 추출
    const links = Array.isArray(item.link) ? item.link : [item.link];
    const categories = links
      .filter((l: any) => l['@_type'] === 'boardgamecategory')
      .map((l: any) => ({
        id: l['@_id'],
        name: l['@_value'],
      }));

    // 메커니즘 추출
    const mechanisms = links
      .filter((l: any) => l['@_type'] === 'boardgamemechanic')
      .map((l: any) => ({
        id: l['@_id'],
        name: l['@_value'],
      }));

    // 통계 정보
    const stats = item.statistics?.ratings;
    const bggRating = stats?.average?.['@_value']
      ? parseFloat(stats.average['@_value'])
      : undefined;

    // 순위 정보
    const ranks = stats?.ranks?.rank;
    const rankArray = Array.isArray(ranks) ? ranks : [ranks];
    const overallRank = rankArray.find((r: any) => r['@_id'] === '1');
    const strategyRank = rankArray.find((r: any) => r['@_id'] === '5497');

    const bggRankOverall = overallRank?.['@_value']
      ? parseInt(overallRank['@_value'])
      : undefined;
    const bggRankStrategy = strategyRank?.['@_value']
      ? parseInt(strategyRank['@_value'])
      : undefined;

    const gameData: BggGameData = {
      bggId,
      nameEn,
      yearPublished: item.yearpublished?.['@_value'],
      minPlayers: item.minplayers?.['@_value'],
      maxPlayers: item.maxplayers?.['@_value'],
      minPlaytime: item.minplaytime?.['@_value'],
      maxPlaytime: item.maxplaytime?.['@_value'],
      description: item.description,
      imageUrl: item.image,
      thumbnailUrl: item.thumbnail,
      bggRating,
      bggRankOverall: isNaN(bggRankOverall!) ? undefined : bggRankOverall,
      bggRankStrategy: isNaN(bggRankStrategy!) ? undefined : bggRankStrategy,
      categories: categories.length > 0 ? categories : undefined,
      mechanisms: mechanisms.length > 0 ? mechanisms : undefined,
    };

    // bestPlayerCount 추가
    if (bestPlayerCount) {
      gameData.minPlayers = gameData.minPlayers || bestPlayerCount;
      gameData.maxPlayers = gameData.maxPlayers || bestPlayerCount;
    }

    return gameData;
  } catch (error: any) {
    console.error(`BGG API 에러 (bggId: ${bggId}):`, error.message);
    throw new Error(`BGG에서 게임 정보를 가져올 수 없습니다: ${error.message}`);
  }
};

// 여러 게임 정보 일괄 가져오기
export const fetchGamesFromBGG = async (bggIds: number[]): Promise<BggGameData[]> => {
  const games: BggGameData[] = [];

  for (const bggId of bggIds) {
    try {
      const game = await fetchGameFromBGG(bggId);
      if (game) {
        games.push(game);
      }
      // Rate limit 방지를 위한 딜레이
      await delay(1000); // 1초 대기
    } catch (error) {
      console.error(`게임 ${bggId} 가져오기 실패:`, error);
      // 에러 발생해도 계속 진행
    }
  }

  return games;
};

// BGG 인기 게임 목록 가져오기 (Hot list)
export const fetchHotGamesFromBGG = async (): Promise<number[]> => {
  try {
    const url = `/hot?type=boardgame`;
    const response = await bggClient.get(url);
    const parsed = parser.parse(response.data);

    const items = parsed?.items?.item;
    if (!items) {
      return [];
    }

    const itemArray = Array.isArray(items) ? items : [items];
    return itemArray.map((item: any) => item['@_id']).filter(Boolean);
  } catch (error: any) {
    console.error('BGG Hot List 가져오기 실패:', error.message);
    return [];
  }
};

