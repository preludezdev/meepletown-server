import {
  findAllPosts,
  findPostById,
  findPostsByUserId,
  createPost,
  updatePost,
  incrementViewCount,
  deletePost,
} from '../repositories/postRepository';
import {
  Post,
  PostWithAuthor,
  CreatePostRequest,
  UpdatePostRequest,
  PostFilter,
} from '../models/Post';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

// 포럼 글 목록 조회
export const getPostsService = async (
  filter: PostFilter,
  page: number,
  pageSize: number
): Promise<{ posts: PostWithAuthor[]; total: number; page: number; pageSize: number }> => {
  const { posts, total } = await findAllPosts(filter, page, pageSize);
  return { posts, total, page, pageSize };
};

// 포럼 글 상세 조회 (조회수 증가 포함)
export const getPostByIdService = async (id: number): Promise<PostWithAuthor> => {
  const post = await findPostById(id);
  if (!post) throw new NotFoundError('게시글을 찾을 수 없습니다');

  // 임시저장 글은 상세 조회 불가 (본인 제외)
  if (post.isDraft) throw new NotFoundError('게시글을 찾을 수 없습니다');

  await incrementViewCount(id);
  return { ...post, viewCount: post.viewCount + 1 };
};

// 내 글 목록 조회 (임시저장 포함)
export const getMyPostsService = async (userId: number): Promise<PostWithAuthor[]> => {
  return findPostsByUserId(userId);
};

// 내 임시저장 글 상세 조회
export const getMyDraftService = async (
  id: number,
  userId: number
): Promise<PostWithAuthor> => {
  const post = await findPostById(id);
  if (!post) throw new NotFoundError('게시글을 찾을 수 없습니다');
  if (post.userId !== userId) throw new ForbiddenError('본인의 글만 조회할 수 있습니다');
  return post;
};

// 포럼 글 생성
export const createPostService = async (
  userId: number,
  data: CreatePostRequest
): Promise<Post> => {
  // boardType과 gameId 정합성 검사
  if (data.boardType === 'game_forum' && !data.gameId) {
    throw new BadRequestError('게임포럼 글에는 gameId가 필요합니다');
  }
  if (data.boardType === 'free_board' && data.gameId) {
    throw new BadRequestError('자유게시판 글에는 게임을 지정할 수 없습니다');
  }

  return createPost(userId, data);
};

// 포럼 글 수정
export const updatePostService = async (
  id: number,
  userId: number,
  data: UpdatePostRequest
): Promise<Post> => {
  const post = await findPostById(id);
  if (!post) throw new NotFoundError('게시글을 찾을 수 없습니다');
  if (post.userId !== userId) throw new ForbiddenError('본인의 글만 수정할 수 있습니다');

  const updated = await updatePost(id, data);
  if (!updated) throw new NotFoundError('게시글을 찾을 수 없습니다');
  return updated;
};

// 포럼 글 삭제
export const deletePostService = async (id: number, userId: number): Promise<void> => {
  const post = await findPostById(id);
  if (!post) throw new NotFoundError('게시글을 찾을 수 없습니다');
  if (post.userId !== userId) throw new ForbiddenError('본인의 글만 삭제할 수 있습니다');

  await deletePost(id);
};
