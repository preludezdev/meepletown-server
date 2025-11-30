// 커스텀 에러 클래스 정의

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 일반적인 에러 타입들
export class BadRequestError extends AppError {
  constructor(message: string = '잘못된 요청입니다') {
    super(message, 'BAD_REQUEST', 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '인증이 필요합니다') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '권한이 없습니다') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '리소스를 찾을 수 없습니다') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '이미 존재하는 리소스입니다') {
    super(message, 'CONFLICT', 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = '서버 오류가 발생했습니다') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
  }
}

