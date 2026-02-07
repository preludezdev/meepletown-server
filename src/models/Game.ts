// Game 모델 타입 정의 (BGG 데이터 기반)

import { GameRating } from './GameRating';

export interface Game {
  id: number;
  bggId: number;
  nameKo: string | null;
  nameEn: string;
  alternateNames: string | null; // JSON 배열 문자열 (다른 언어/에디션 이름)
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  bestPlayerCount: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  minAge: number | null; // 권장 연령
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  
  // 제작진 정보 (JSON 배열 문자열)
  designers: string | null; // [{id, name}]
  artists: string | null; // [{id, name}]
  publishers: string | null; // [{id, name}]
  
  // 평점/통계
  bggRating: number | null;
  averageWeight: number | null; // 평균 난이도 (0-5)
  meepleonRating: number | null;
  ratingCount: number;
  usersRated: number | null; // 평가한 유저 수
  
  // 커뮤니티 통계
  owned: number | null; // 소유한 유저 수
  trading: number | null; // 교환 희망 유저 수
  wanting: number | null; // 구매 희망 유저 수
  wishing: number | null; // 위시리스트에 담은 유저 수
  numComments: number | null; // 댓글 수
  numWeights: number | null; // 난이도 투표 수
  
  // 랭킹
  bggRankOverall: number | null;
  bggRankStrategy: number | null;
  
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// DB에서 조회한 Row 타입
export interface GameRow {
  id: number;
  bggId: number;
  nameKo: string | null;
  nameEn: string;
  alternateNames: string | null;
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  bestPlayerCount: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  minAge: number | null;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  designers: string | null;
  artists: string | null;
  publishers: string | null;
  bggRating: number | null;
  averageWeight: number | null;
  meepleonRating: number | null;
  ratingCount: number;
  usersRated: number | null;
  owned: number | null;
  trading: number | null;
  wanting: number | null;
  wishing: number | null;
  numComments: number | null;
  numWeights: number | null;
  bggRankOverall: number | null;
  bggRankStrategy: number | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 게임 상세 응답 타입 (카테고리, 메커니즘 포함)
export interface GameDetailResponse {
  id: number;
  bggId: number;
  nameKo: string | null;
  nameEn: string;
  alternateNames: string[] | null; // 파싱된 배열
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  bestPlayerCount: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  minAge: number | null;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  
  // 제작진 정보 (파싱된 배열)
  designers: Array<{ id: number; name: string }> | null;
  artists: Array<{ id: number; name: string }> | null;
  publishers: Array<{ id: number; name: string }> | null;
  
  // 평점/통계
  bggRating: number | null;
  averageWeight: number | null;
  meepleonRating: number | null;
  ratingCount: number;
  usersRated: number | null;
  
  // 커뮤니티 통계
  owned: number | null;
  trading: number | null;
  wanting: number | null;
  wishing: number | null;
  numComments: number | null;
  numWeights: number | null;
  
  // 랭킹
  bggRankOverall: number | null;
  bggRankStrategy: number | null;
  
  categories: GameCategory[];
  mechanisms: GameMechanism[];
  userRating?: GameRating | null;
  createdAt: Date;
  updatedAt: Date;
}

// 게임 카테고리
export interface GameCategory {
  id: number;
  nameEn: string;
  nameKo: string | null;
  bggCategoryId: number;
}

// 게임 메커니즘
export interface GameMechanism {
  id: number;
  nameEn: string;
  nameKo: string | null;
  bggMechanismId: number;
}

// BGG 데이터 동기화용 타입
export interface BggGameData {
  bggId: number;
  nameEn: string;
  nameKo?: string;
  alternateNames?: string[];
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  minAge?: number;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  
  // 제작진
  designers?: Array<{ id: number; name: string }>;
  artists?: Array<{ id: number; name: string }>;
  publishers?: Array<{ id: number; name: string }>;
  
  // 평점/통계
  bggRating?: number;
  averageWeight?: number;
  usersRated?: number;
  
  // 커뮤니티 통계
  owned?: number;
  trading?: number;
  wanting?: number;
  wishing?: number;
  numComments?: number;
  numWeights?: number;
  
  // 랭킹
  bggRankOverall?: number;
  bggRankStrategy?: number;
  
  categories?: Array<{ id: number; name: string }>;
  mechanisms?: Array<{ id: number; name: string }>;
}

