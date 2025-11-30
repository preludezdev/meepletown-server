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
}

// 환경변수 검증 및 반환
export const getEnvConfig = (): EnvConfig => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_NAME',
    'JWT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => process.env[varName] === undefined
  );

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
  };
};

// 환경변수 싱글톤 인스턴스
export const env = getEnvConfig();

