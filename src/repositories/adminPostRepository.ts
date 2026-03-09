import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import {
  PostWithAuthor,
  ContentBlock,
  PostFilter,
} from '../models/Post';
import { deletePost } from './postRepository';

// Admin용 필터 (includeDraft, search 추가)
export interface AdminPostFilter extends PostFilter {
  includeDraft?: boolean;
  search?: string;
}

// DB Row → PostWithAuthor 변환
const rowToPostWithAuthor = (row: RowDataPacket): PostWithAuthor => {
  const contentBlocks =
    typeof row.contentBlocks === 'string'
      ? (JSON.parse(row.contentBlocks) as ContentBlock[])
      : (row.contentBlocks as ContentBlock[]);
  return {
    ...row,
    contentBlocks,
    isDraft: Boolean(row.isDraft),
    authorNickname: row.authorNickname as string,
    authorAvatar: row.authorAvatar as string | null,
    gameName: row.gameName as string | null,
    gameThumbnailUrl: row.gameThumbnailUrl as string | null,
  } as PostWithAuthor;
};

// 어드민용 포럼 글 목록 조회 (임시저장 포함, 제목 검색 가능)
export const findPostsForAdmin = async (
  filter: AdminPostFilter = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{ posts: PostWithAuthor[]; total: number }> => {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (!filter.includeDraft) {
    conditions.push('p.isDraft = FALSE');
  }
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
  if (filter.search && filter.search.trim()) {
    conditions.push('p.title LIKE ?');
    params.push(`%${filter.search.trim()}%`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
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
     LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );

  return { posts: rows.map(rowToPostWithAuthor), total };
};

// 어드민 글 삭제 (postRepository deletePost 재사용)
export const deletePostByAdmin = async (id: number): Promise<boolean> => {
  return deletePost(id);
};
