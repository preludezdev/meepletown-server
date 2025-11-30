import pool from '../config/database';
import { User, UserRow, SocialLoginRequest } from '../models/User';
import { RowDataPacket } from 'mysql2';

// 소셜 ID로 사용자 조회
export const findUserBySocialId = async (
  socialId: string,
  socialType: string
): Promise<User | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM users WHERE socialId = ? AND socialType = ?',
    [socialId, socialType]
  );
  return (rows[0] as UserRow) || null;
};

// ID로 사용자 조회
export const findUserById = async (id: number): Promise<User | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return (rows[0] as UserRow) || null;
};

// 소셜 로그인으로 사용자 생성 또는 조회
export const findOrCreateUserBySocial = async (
  socialData: SocialLoginRequest
): Promise<User> => {
  // 기존 사용자 조회
  const existingUser = await findUserBySocialId(
    socialData.socialId,
    socialData.socialType
  );

  if (existingUser) {
    // 닉네임/아바타 업데이트 (소셜에서 변경되었을 수 있음)
    if (
      existingUser.nickname !== socialData.nickname ||
      existingUser.avatar !== socialData.avatar
    ) {
      await pool.execute(
        'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
        [socialData.nickname, socialData.avatar || null, existingUser.id]
      );
      return (await findUserById(existingUser.id))!;
    }
    return existingUser;
  }

  // 새 사용자 생성
  const [result] = await pool.execute(
    'INSERT INTO users (socialId, socialType, nickname, avatar) VALUES (?, ?, ?, ?)',
    [
      socialData.socialId,
      socialData.socialType,
      socialData.nickname,
      socialData.avatar || null,
    ]
  );

  const insertId = (result as any).insertId;
  const newUser = await findUserById(insertId);
  if (!newUser) {
    throw new Error('사용자 생성 후 조회 실패');
  }
  return newUser;
};
