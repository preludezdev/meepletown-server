import { Response } from 'express';

// 공통 응답 포맷 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 성공 응답 헬퍼
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
};

// 에러 응답 헬퍼
export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  res.status(statusCode).json(response);
};

