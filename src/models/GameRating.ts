// GameRating 모델 타입 정의 (미플온 평점)

export interface GameRating {
  id: number;
  userId: number;
  gameId: number;
  rating: number; // 0-10
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// DB에서 조회한 Row 타입
export interface GameRatingRow {
  id: number;
  userId: number;
  gameId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 평점 생성 요청
export interface CreateGameRatingRequest {
  rating: number; // 0-10
  comment?: string;
}

// 평점 업데이트 요청
export interface UpdateGameRatingRequest {
  rating?: number;
  comment?: string;
}

// 평점 응답 (사용자 정보 포함)
export interface GameRatingWithUser extends GameRating {
  userNickname: string;
  userAvatar: string | null;
}

