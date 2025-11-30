import { findUserById } from '../repositories/userRepository';
import { UserResponse } from '../models/User';
import { NotFoundError } from '../utils/errors';

// 사용자 조회
export const getUserById = async (id: number): Promise<UserResponse> => {
  const user = await findUserById(id);
  if (!user) {
    throw new NotFoundError('사용자를 찾을 수 없습니다');
  }

  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
};
