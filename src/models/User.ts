// User 모델 타입 정의 (소셜 로그인 기반)

export type SocialType = 'kakao' | 'google';

export interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  socialId: string;
  socialType: SocialType;
  createdAt: Date;
  updatedAt: Date;
}

// DB에서 조회한 Row 타입
export interface UserRow {
  id: number;
  nickname: string;
  avatar: string | null;
  socialId: string;
  socialType: SocialType;
  createdAt: Date;
  updatedAt: Date;
}

// 응답용 User 타입
export interface UserResponse {
  id: number;
  nickname: string;
  avatar: string | null;
  createdAt: Date;
}

// 소셜 로그인으로 사용자 생성/조회 요청
export interface SocialLoginRequest {
  socialId: string;
  socialType: SocialType;
  nickname: string;
  avatar?: string;
}
