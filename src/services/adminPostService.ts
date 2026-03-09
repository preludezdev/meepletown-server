import * as adminPostRepository from '../repositories/adminPostRepository';
import * as postRepository from '../repositories/postRepository';
import { AdminPostFilter } from '../repositories/adminPostRepository';
import { PostWithAuthor } from '../models/Post';

// 어드민용 포럼 글 목록 조회
export const getPostsForAdmin = async (
  filter: AdminPostFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<{ posts: PostWithAuthor[]; total: number }> => {
  return adminPostRepository.findPostsForAdmin(filter, page, pageSize);
};

// 어드민 글 삭제 (존재 여부 확인 후 삭제)
export const deletePostByAdmin = async (id: number): Promise<void> => {
  const post = await postRepository.findPostById(id);
  if (!post) {
    throw new Error('글이 존재하지 않습니다');
  }
  const deleted = await adminPostRepository.deletePostByAdmin(id);
  if (!deleted) {
    throw new Error('글 삭제에 실패했습니다');
  }
};
