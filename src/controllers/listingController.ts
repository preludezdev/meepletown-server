import { Request, Response, NextFunction } from 'express';
import * as listingService from '../services/listingService';
import { sendSuccess, sendError } from '../utils/response';

// 모든 Listing 조회 (필터, 정렬)
export const getAllListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const gameName = req.query.gameName as string | undefined;
    const method = req.query.method as 'direct' | 'delivery' | undefined;
    const sort = (req.query.sort as 'latest') || 'latest';

    const filter = {
      ...(gameName && { gameName }),
      ...(method && { method }),
    };

    const result = await listingService.getAllListings(filter, sort, page, pageSize);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// Listing 상세 조회
export const getListingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'BAD_REQUEST', '유효하지 않은 ID입니다', 400);
      return;
    }

    const listing = await listingService.getListingById(id);
    sendSuccess(res, listing);
  } catch (error) {
    next(error);
  }
};

// 내 매물 목록 조회
export const getMyListings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }

    const listings = await listingService.getMyListings(userId);
    sendSuccess(res, listings);
  } catch (error) {
    next(error);
  }
};

// Listing 생성
export const createListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }

    const listing = await listingService.createListingService(userId, req.body);
    sendSuccess(res, listing, 201);
  } catch (error) {
    next(error);
  }
};

// Listing 이미지 추가
export const addListingImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'BAD_REQUEST', '유효하지 않은 ID입니다', 400);
      return;
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }

    const { images } = req.body;
    if (!images || !Array.isArray(images)) {
      sendError(res, 'BAD_REQUEST', 'images 배열이 필요합니다', 400);
      return;
    }

    await listingService.addListingImages(id, images, userId);
    sendSuccess(res, { message: '이미지가 추가되었습니다' });
  } catch (error) {
    next(error);
  }
};

// Listing 상태 변경
export const updateListingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'BAD_REQUEST', '유효하지 않은 ID입니다', 400);
      return;
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }

    const { status } = req.body;
    if (!status || !['selling', 'sold'].includes(status)) {
      sendError(res, 'BAD_REQUEST', 'status는 selling 또는 sold여야 합니다', 400);
      return;
    }

    const listing = await listingService.updateListingStatus(id, status, userId);
    sendSuccess(res, listing);
  } catch (error) {
    next(error);
  }
};

// Listing 삭제
export const deleteListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'BAD_REQUEST', '유효하지 않은 ID입니다', 400);
      return;
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      sendError(res, 'UNAUTHORIZED', '인증이 필요합니다', 401);
      return;
    }

    await listingService.deleteListingById(id, userId);
    sendSuccess(res, { message: '매물이 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
};


