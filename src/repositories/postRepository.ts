import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  Post,
  PostWithAuthor,
  ContentBlock,
  CreatePostRequest,
  UpdatePostRequest,
  PostFilter,
} from '../models/Post';

// DB Row → Post 변환 (contentBlocks JSON 파싱)
const rowToPost = (row: RowDataPacket): Post => ({
  ...row,
  contentBlocks:
    typeof row.contentBlocks === 'string'
      ? (JSON.parse(row.contentBlocks) as ContentBlock[])
      : (row.contentBlocks as ContentBlock[]),
  isDraft: Boolean(row.isDraft),
} as Post);

const rowToPostWithAuthor = (row: RowDataPacket): PostWithAuthor => ({
  ...rowToPost(row),
  authorNickname: row.authorNickname as string,
  authorAvatar: row.authorAvatar as string | null,
  gameName: row.gameName as string | null,
  gameThumbnailUrl: row.gameThumbnailUrl as string | null,
});

// 포럼 글 목록 조회 (필터 + 페이지네이션)
export const findAllPosts = async (
  filter: PostFilter = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{ posts: PostWithAuthor[]; total: number }> => {
  const conditions: string[] = ['p.isDraft = FALSE'];
  const params: (string | number | boolean)[] = [];

  if (filter.boardType) {
    conditions.push('p.boardType = ?');
    params.push(filter.boardType);
  }
  if (filter.gameId !== undefined) {
    conditions.push('p.gameId = ?');
    params.push(filter.gameId);
  }
  if (filter.category) {
    conditions.push('p.category = ?');
    params.push(filter.category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM posts p ${where}`,
    params
  );
  const total = (countRows[0] as any).total as number;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.*,
            u.nickname     AS authorNickname,
            u.avatar       AS authorAvatar,
            g.nameKo       AS gameName,
            g.thumbnailUrl AS gameThumbnailUrl
     FROM   posts p
     JOIN   users u ON u.id = p.userId
     LEFT JOIN games g ON g.id = p.gameId
     ${where}
     ORDER BY p.updatedAt DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return { posts: rows.map(rowToPostWithAuthor), total };
};

// 포럼 글 단건 조회
export const findPostById = async (id: number): Promise<PostWithAuthor | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.*,
            u.nickname     AS authorNickname,
            u.avatar       AS authorAvatar,
            g.nameKo       AS gameName,
            g.thumbnailUrl AS gameThumbnailUrl
     FROM   posts p
     JOIN   users u ON u.id = p.userId
     LEFT JOIN games g ON g.id = p.gameId
     WHERE  p.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  return rowToPostWithAuthor(rows[0]);
};

// 내 글 목록 (임시저장 포함)
export const findPostsByUserId = async (userId: number): Promise<PostWithAuthor[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.*,
            u.nickname     AS authorNickname,
            u.avatar       AS authorAvatar,
            g.nameKo       AS gameName,
            g.thumbnailUrl AS gameThumbnailUrl
     FROM   posts p
     JOIN   users u ON u.id = p.userId
     LEFT JOIN games g ON g.id = p.gameId
     WHERE  p.userId = ?
     ORDER BY p.updatedAt DESC`,
    [userId]
  );
  return rows.map(rowToPostWithAuthor);
};

// 포럼 글 생성
export const createPost = async (
  userId: number,
  data: CreatePostRequest & { gameId?: number }
): Promise<Post> => {
  const contentBlocksJson = JSON.stringify(data.contentBlocks);
  const isDraft = data.isDraft ?? false;

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO posts
       (userId, boardType, gameId, category, title, contentBlocks, isDraft)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.boardType,
      data.gameId ?? null,
      data.category,
      data.title,
      contentBlocksJson,
      isDraft,
    ]
  );

  const post = await findPostById(result.insertId);
  if (!post) throw new Error('글 생성 후 조회 실패');
  return post;
};

// 포럼 글 수정
export const updatePost = async (
  id: number,
  data: UpdatePostRequest
): Promise<Post | null> => {
  const fields: string[] = [];
  const params: (string | number | boolean | null)[] = [];

  if (data.category !== undefined) {
    fields.push('category = ?');
    params.push(data.category);
  }
  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }
  if (data.contentBlocks !== undefined) {
    fields.push('contentBlocks = ?');
    params.push(JSON.stringify(data.contentBlocks));
  }
  if (data.isDraft !== undefined) {
    fields.push('isDraft = ?');
    params.push(data.isDraft);
  }

  if (fields.length === 0) return findPostById(id);

  fields.push('updatedAt = NOW()');
  params.push(id);

  await pool.execute(
    `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  return findPostById(id);
};

// 조회수 증가
export const incrementViewCount = async (id: number): Promise<void> => {
  await pool.execute('UPDATE posts SET viewCount = viewCount + 1 WHERE id = ?', [id]);
};

// 포럼 글 삭제
export const deletePost = async (id: number): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM posts WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};
