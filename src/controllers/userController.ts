import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { sendSuccess, sendError } from '../utils/response';

// 사용자 조회
export const getUserById = async (
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

    const user = await userService.getUserById(id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
