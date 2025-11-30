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

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    db: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD || '', // 빈 문자열 허용 (로컬 MySQL은 비밀번호 없을 수 있음)
      name: process.env.DB_NAME!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  };
};

// 환경변수 싱글톤 인스턴스
export const env = getEnvConfig();

