import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import {
  findUserById,
  updatePhoneVerification,
} from '../repositories/userRepository';
import { UserResponse, UserRow } from '../models/User';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

// JWT 토큰 생성
export const generateToken = (userId: number, identifier: string): string => {
  return jwt.sign(
    { userId, identifier },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn,
    } as jwt.SignOptions
  );
};

// JWT 토큰 검증
export const verifyToken = (token: string): { userId: number; identifier: string } => {
  try {
    const decoded = jwt.verify(token, env.jwt.secret) as {
      userId: number;
      identifier: string;
    };
    return decoded;
  } catch (error) {
    throw new UnauthorizedError('유효하지 않은 토큰입니다');
  }
};

// 사용자 정보 조회 (토큰 기반)
export const getCurrentUser = async (userId: number): Promise<UserResponse> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다');
  }

  const row = user as UserRow;
  const phoneVerifiedAt = row.phoneVerifiedAt;
  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    phoneNumber: row.phoneNumber ?? null,
    phoneVerifiedAt: phoneVerifiedAt
      ? (typeof phoneVerifiedAt === 'object' && 'toISOString' in phoneVerifiedAt
          ? (phoneVerifiedAt as Date).toISOString()
          : String(phoneVerifiedAt))
      : null,
    isPhoneVerified: !!phoneVerifiedAt,
    createdAt: user.createdAt,
  };
};

// 번호인증 완료 후 서버에 저장
export const verifyPhone = async (
  userId: number,
  phoneNumber: string
): Promise<UserResponse> => {
  await updatePhoneVerification(userId, phoneNumber);
  return getCurrentUser(userId);
};
