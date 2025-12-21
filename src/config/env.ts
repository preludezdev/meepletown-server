import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 환경변수 타입 정의
export interface EnvConfig {
  port: number;
  nodeEnv: string;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  bggApiToken?: string; // BGG API Authorization 토큰
}

// 환경변수 검증 및 반환
export const getEnvConfig = (): EnvConfig => {
  // Railway MySQL 환경변수 또는 일반 환경변수 확인
  const hasDbHost = process.env.MYSQL_HOST || process.env.DB_HOST;
  const hasDbUser = process.env.MYSQL_USER || process.env.DB_USER;
  const hasDbName = process.env.MYSQL_DATABASE || process.env.DB_NAME;
  const hasJwtSecret = process.env.JWT_SECRET;

  const missingVars: string[] = [];
  if (!hasDbHost) missingVars.push('DB_HOST 또는 MYSQL_HOST');
  if (!hasDbUser) missingVars.push('DB_USER 또는 MYSQL_USER');
  if (!hasDbName) missingVars.push('DB_NAME 또는 MYSQL_DATABASE');
  if (!hasJwtSecret) missingVars.push('JWT_SECRET');

  if (missingVars.length > 0) {
    throw new Error(
      `필수 환경변수가 누락되었습니다: ${missingVars.join(', ')}`
    );
  }

  // Railway MySQL 환경변수 지원 (Railway는 MYSQL_* 접두사 사용)
  // 우선순위: Railway 변수 > 기존 변수
  const dbHost = process.env.MYSQL_HOST || process.env.DB_HOST!;
  const dbUser = process.env.MYSQL_USER || process.env.DB_USER!;
  const dbPassword = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME!;
  const dbPort = parseInt(
    process.env.MYSQL_PORT || process.env.DB_PORT || '3306',
    10
  );

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    db: {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      name: dbName,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    bggApiToken: process.env.BGG_API_TOKEN, // BGG API 토큰 (선택사항)
  };
};

// 환경변수 싱글톤 인스턴스
export const env = getEnvConfig();

