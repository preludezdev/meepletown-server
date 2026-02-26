// Post 모델 타입 정의 (포럼 글)

export type BoardType = 'game_forum' | 'free_board';

export type GameForumCategory = '소식' | '리뷰' | '자료' | '질문' | '공략';
export type FreeBoardCategory = '유머' | '잡담' | '창작' | '모임후기';
export type PostCategory = GameForumCategory | FreeBoardCategory;

export type ContentBlockType = 'text' | 'image';

export interface TextContentBlock {
  type: 'text';
  value: string;
}

export interface ImageContentBlock {
  type: 'image';
  url: string;
}

export type ContentBlock = TextContentBlock | ImageContentBlock;

export interface Post {
  id: number;
  userId: number;
  boardType: BoardType;
  gameId: number | null;
  category: PostCategory;
  title: string;
  contentBlocks: ContentBlock[];
  isDraft: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 목록 조회용 (작성자 닉네임, 아바타, 게임 썸네일 포함)
export interface PostWithAuthor extends Post {
  authorNickname: string;
  authorAvatar: string | null;
  gameName: string | null;
  gameThumbnailUrl: string | null;
}

// 글 생성 요청 타입
export interface CreatePostRequest {
  boardType: BoardType;
  gameId?: number;
  category: PostCategory;
  title: string;
  contentBlocks: ContentBlock[];
  isDraft?: boolean;
}

// 글 수정 요청 타입
export interface UpdatePostRequest {
  category?: PostCategory;
  title?: string;
  contentBlocks?: ContentBlock[];
  isDraft?: boolean;
}

// 목록 조회 필터
export interface PostFilter {
  boardType?: BoardType;
  gameId?: number;
  category?: PostCategory;
  isDraft?: boolean;
}
