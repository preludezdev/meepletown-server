import {
  findAllListings,
  findTodayListings,
  findListingById,
  findListingsByUserId,
  createListing,
  updateListing,
  deleteListing,
} from '../repositories/listingRepository';
import {
  findImagesByListingId,
  createListingImage,
  deleteImagesByListingId,
} from '../repositories/listingImageRepository';
import { getOrSyncGame } from './gameSyncService';
import {
  Listing,
  ListingWithImages,
  CreateListingRequest,
  UpdateListingRequest,
  ListingFilter,
  ListingSort,
} from '../models/Listing';
import { CreateListingImageRequest } from '../models/ListingImage';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

// 모든 Listing 조회 (필터, 정렬, 페이지네이션)
export const getAllListings = async (
  filter?: ListingFilter,
  sort: ListingSort = 'latest',
  page: number = 1,
  pageSize: number = 20
): Promise<{
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  const { listings, total } = await findAllListings(filter, sort, page, pageSize);
  return { listings, total, page, pageSize };
};

// 오늘의 매물 조회
export const getTodayListings = async (limit: number = 20): Promise<Listing[]> => {
  return findTodayListings(limit);
};

// Listing 상세 조회 (이미지 포함)
export const getListingById = async (id: number): Promise<ListingWithImages> => {
  const listing = await findListingById(id);
  if (!listing) {
    throw new NotFoundError('매물을 찾을 수 없습니다');
  }

  const images = await findImagesByListingId(id);

  return {
    ...listing,
    images,
  };
};

// 내 매물 목록 조회
export const getMyListings = async (userId: number): Promise<Listing[]> => {
  return findListingsByUserId(userId);
};

// Listing 생성
export const createListingService = async (
  userId: number,
  listingData: CreateListingRequest
): Promise<Listing> => {
  // gameBggId가 제공된 경우, Game 테이블에서 조회/동기화
  let gameId: number | undefined;
  let gameName = listingData.gameName || '';

  if (listingData.gameBggId) {
    try {
      const game = await getOrSyncGame(listingData.gameBggId);
      gameId = game.id;
      gameName = game.nameKo || game.nameEn; // 게임명 자동 설정
    } catch (error) {
      console.error('게임 동기화 실패:', error);
      // 게임 동기화 실패해도 매물 등록은 허용
      if (!listingData.gameName) {
        throw new BadRequestError('gameBggId로 게임을 찾을 수 없습니다. gameName을 제공해주세요.');
      }
    }
  }

  // gameBggId도 gameName도 없으면 에러
  if (!gameId && !gameName) {
    throw new BadRequestError('gameBggId 또는 gameName 중 하나는 필수입니다');
  }

  // Repository에 전달할 데이터 준비
  const listingDataWithGame = {
    ...listingData,
    gameId,
    gameName,
  };

  return createListing(userId, listingDataWithGame);
};

// Listing 이미지 추가 (최대 3장)
export const addListingImages = async (
  listingId: number,
  images: CreateListingImageRequest[],
  userId: number
): Promise<void> => {
  // Listing 소유자 확인
  const listing = await findListingById(listingId);
  if (!listing) {
    throw new NotFoundError('매물을 찾을 수 없습니다');
  }
  if (listing.userId !== userId) {
    throw new ForbiddenError('본인의 매물에만 이미지를 추가할 수 있습니다');
  }

  // 기존 이미지 개수 확인
  const existingImages = await findImagesByListingId(listingId);
  if (existingImages.length + images.length > 3) {
    throw new BadRequestError('이미지는 최대 3장까지 등록할 수 있습니다');
  }

  // 이미지 추가
  for (const image of images) {
    await createListingImage(listingId, image);
  }
};

// Listing 업데이트
export const updateListingById = async (
  id: number,
  listingData: UpdateListingRequest,
  userId: number
): Promise<Listing> => {
  const listing = await findListingById(id);
  if (!listing) {
    throw new NotFoundError('매물을 찾을 수 없습니다');
  }

  // 본인만 수정 가능
  if (listing.userId !== userId) {
    throw new ForbiddenError('본인의 매물만 수정할 수 있습니다');
  }

  // gameBggId가 제공된 경우, Game 테이블에서 조회/동기화
  let gameId: number | undefined;
  let gameName = listingData.gameName;

  if (listingData.gameBggId) {
    try {
      const game = await getOrSyncGame(listingData.gameBggId);
      gameId = game.id;
      gameName = game.nameKo || game.nameEn;
    } catch (error) {
      console.error('게임 동기화 실패:', error);
      // 동기화 실패해도 기존 gameName 유지
    }
  }

  const listingDataWithGame = {
    ...listingData,
    ...(gameId !== undefined && { gameId }),
    ...(gameName !== undefined && { gameName }),
  };

  const updatedListing = await updateListing(id, listingDataWithGame);
  if (!updatedListing) {
    throw new NotFoundError('매물을 찾을 수 없습니다');
  }

  return updatedListing;
};

// Listing 상태 변경
export const updateListingStatus = async (
  id: number,
  status: 'selling' | 'sold',
  userId: number
): Promise<Listing> => {
  const listing = await findListingById(id);
  if (!listing) {
    throw new NotFoundError('매물을 찾을 수 없습니다');
  }

  // 본인만 상태 변경 가능
  if (listing.userId !== userId) {
    throw new ForbiddenError('본인의 매물만 상태를 변경할 수 있습니다');
  }

  const updatedListing = await updateListing(id, { status });
  if (!updatedListing) {
    throw new NotFoundError('매물을 찾을 수 없습니다');
  }

  return updatedListing;
};

// Listing 삭제
export const deleteListingById = async (
  id: number,
  userId: number
): Promise<boolean> => {
  const listing = await findListingById(id);
  if (!listing) {
    throw new NotFoundError('매물을 찾을 수 없습니다');
  }

  // 본인만 삭제 가능
  if (listing.userId !== userId) {
    throw new ForbiddenError('본인의 매물만 삭제할 수 있습니다');
  }

  // 이미지도 함께 삭제
  await deleteImagesByListingId(id);

  const deleted = await deleteListing(id);
  if (!deleted) {
    throw new NotFoundError('매물을 찾을 수 없습니다');
  }

  return true;
};
