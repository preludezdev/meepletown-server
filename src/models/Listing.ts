// Listing 모델 타입 정의 (v0 간소화 버전)
import { ListingImage } from './ListingImage';

export type ListingMethod = 'direct' | 'delivery'; // 직거래 / 택배
export type ListingStatus = 'selling' | 'sold'; // 판매중 / 판매완료

export interface Listing {
  id: number;
  userId: number;
  gameId: number | null; // 게임 ID (games 테이블 참조)
  gameName: string; // 레거시 호환용
  title: string | null;
  price: number;
  method: ListingMethod;
  region: string | null;
  description: string | null;
  contactLink: string | null;
  status: ListingStatus;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Listing with images (상세 조회용)
export interface ListingWithImages extends Listing {
  images: ListingImage[];
}

// Listing 생성 요청 타입
export interface CreateListingRequest {
  gameBggId?: number; // BGG 게임 ID (우선)
  gameName?: string; // 게임명 (레거시 호환)
  title?: string;
  price: number;
  method: ListingMethod;
  region?: string;
  description?: string;
  contactLink?: string;
}

// Listing 업데이트 요청 타입
export interface UpdateListingRequest {
  gameBggId?: number;
  gameName?: string;
  title?: string;
  price?: number;
  method?: ListingMethod;
  region?: string;
  description?: string;
  contactLink?: string;
  status?: ListingStatus;
}

// Listing 필터 타입
export interface ListingFilter {
  gameName?: string;
  method?: ListingMethod;
}

// Listing 정렬 타입
export type ListingSort = 'latest'; // 최신순만 (v0)
