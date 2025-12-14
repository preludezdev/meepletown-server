// GameReview 모델 타입 정의 (후기)

export interface GameReview {
  id: number;
  userId: number;
  gameId: number;
  title: string;
  content: string;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// DB에서 조회한 Row 타입
export interface GameReviewRow {
  id: number;
  userId: number;
  gameId: number;
  title: string;
  content: string;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 후기 생성 요청
export interface CreateGameReviewRequest {
  title: string;
  content: string;
}

// 후기 업데이트 요청
export interface UpdateGameReviewRequest {
  title?: string;
  content?: string;
}

// 후기 응답 (사용자 정보 포함)
export interface GameReviewWithUser extends GameReview {
  userNickname: string;
  userAvatar: string | null;
}

