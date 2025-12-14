import pool from '../config/database';
import { GameRating, GameRatingRow, GameRatingWithUser } from '../models/GameRating';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 게임의 평점 목록 조회 (페이지네이션)
export const findRatingsByGameId = async (
  gameId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<GameRatingWithUser[]> => {
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT r.*, u.nickname as userNickname, u.avatar as userAvatar
     FROM gameRatings r
     INNER JOIN users u ON r.userId = u.id
     WHERE r.gameId = ?
     ORDER BY r.createdAt DESC
     LIMIT ? OFFSET ?`,
    [gameId, pageSize, offset]
  );

  return rows as GameRatingWithUser[];
};

// 특정 사용자의 게임 평가 조회
export const findRatingByUserAndGame = async (
  userId: number,
  gameId: number
): Promise<GameRating | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM gameRatings WHERE userId = ? AND gameId = ?',
    [userId, gameId]
  );
  return (rows[0] as GameRatingRow) || null;
};

// 평점 생성
export const createRating = async (
  userId: number,
  gameId: number,
  rating: number,
  comment: string | null
): Promise<GameRating> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO gameRatings (userId, gameId, rating, comment) VALUES (?, ?, ?, ?)',
    [userId, gameId, rating, comment]
  );

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM gameRatings WHERE id = ?',
    [result.insertId]
  );

  return rows[0] as GameRating;
};

// 평점 수정
export const updateRating = async (
  ratingId: number,
  rating: number | null,
  comment: string | null
): Promise<GameRating> => {
  const updates: string[] = [];
  const values: any[] = [];

  if (rating !== null) {
    updates.push('rating = ?');
    values.push(rating);
  }

  if (comment !== null) {
    updates.push('comment = ?');
    values.push(comment);
  }

  if (updates.length === 0) {
    throw new Error('업데이트할 내용이 없습니다');
  }

  values.push(ratingId);

  await pool.execute(
    `UPDATE gameRatings SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM gameRatings WHERE id = ?',
    [ratingId]
  );

  return rows[0] as GameRating;
};

// 평점 삭제
export const deleteRating = async (ratingId: number): Promise<void> => {
  await pool.execute('DELETE FROM gameRatings WHERE id = ?', [ratingId]);
};

// 게임의 평균 평점 계산
export const calculateAverageRating = async (
  gameId: number
): Promise<{ average: number; count: number }> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT AVG(rating) as average, COUNT(*) as count FROM gameRatings WHERE gameId = ?',
    [gameId]
  );

  const result = rows[0] as any;
  return {
    average: result.average ? parseFloat(result.average) : 0,
    count: result.count || 0,
  };
};

// ID로 평점 조회
export const findRatingById = async (ratingId: number): Promise<GameRating | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM gameRatings WHERE id = ?',
    [ratingId]
  );
  return (rows[0] as GameRatingRow) || null;
};

