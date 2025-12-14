// Game 모델 타입 정의 (BGG 데이터 기반)

import { GameRating } from './GameRating';

export interface Game {
  id: number;
  bggId: number;
  nameKo: string | null;
  nameEn: string;
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  bestPlayerCount: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  bggRating: number | null;
  meepleonRating: number | null;
  ratingCount: number;
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
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  bestPlayerCount: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  bggRating: number | null;
  meepleonRating: number | null;
  ratingCount: number;
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
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  bestPlayerCount: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  bggRating: number | null;
  meepleonRating: number | null;
  ratingCount: number;
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
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  bggRating?: number;
  bggRankOverall?: number;
  bggRankStrategy?: number;
  categories?: Array<{ id: number; name: string }>;
  mechanisms?: Array<{ id: number; name: string }>;
}

