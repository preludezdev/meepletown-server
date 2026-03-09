import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface AdminStats {
  totalGames: number;
  translatedGames: number;
  totalUsers: number;
  forumPosts: number;
  boardPosts: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const [gameRows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total, SUM(CASE WHEN descriptionKo IS NOT NULL THEN 1 ELSE 0 END) AS translated FROM games'
  );

  const [userRows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM users'
  );

  const [postRows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       SUM(CASE WHEN boardType = 'game_forum' AND isDraft = FALSE THEN 1 ELSE 0 END) AS forumPosts,
       SUM(CASE WHEN boardType = 'free_board' AND isDraft = FALSE THEN 1 ELSE 0 END) AS boardPosts
     FROM posts`
  );

  const post = postRows[0] as any;
  return {
    totalGames:      Number(gameRows[0].total       ?? 0),
    translatedGames: Number(gameRows[0].translated  ?? 0),
    totalUsers:      Number(userRows[0].total       ?? 0),
    forumPosts:      Number(post?.forumPosts       ?? 0),
    boardPosts:      Number(post?.boardPosts       ?? 0),
  };
};
