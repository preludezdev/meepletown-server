import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

type AppEnv = 'production' | 'staging' | 'development';

// 환경변수 타입 정의
export interface EnvConfig {
  port: number;
  nodeEnv: string;
  appEnv: AppEnv;
  isProduction: boolean;
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
  bggApiToken?: string;
  adminSecret?: string;
  enableBggCron: boolean; // true = BGG 배치 활성화, false = 비활성화
  baseUrl: string;
  notification?: {
    fcmProjectId: string;
    fcmClientEmail: string;
    fcmPrivateKey: string;
  };
  papago?: {
    clientId: string;
    clientSecret: string;
  };
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

  const rawAppEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  const appEnv: AppEnv = (['production', 'staging', 'development'].includes(rawAppEnv)
    ? rawAppEnv
    : 'development') as AppEnv;

  const hasFcmConfig =
    process.env.FCM_PROJECT_ID &&
    process.env.FCM_CLIENT_EMAIL &&
    process.env.FCM_PRIVATE_KEY;

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    appEnv,
    isProduction: appEnv === 'production',
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
    bggApiToken: process.env.BGG_API_TOKEN,
    adminSecret: process.env.ADMIN_SECRET,
    enableBggCron: process.env.ENABLE_BGG_CRON === 'true',
    baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
    notification: hasFcmConfig
      ? {
          fcmProjectId: process.env.FCM_PROJECT_ID!,
          fcmClientEmail: process.env.FCM_CLIENT_EMAIL!,
          fcmPrivateKey: process.env.FCM_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }
      : undefined,
    papago: process.env.PAPAGO_CLIENT_ID && process.env.PAPAGO_CLIENT_SECRET
      ? {
          clientId: process.env.PAPAGO_CLIENT_ID,
          clientSecret: process.env.PAPAGO_CLIENT_SECRET,
        }
      : undefined,
  };
};

// 환경변수 싱글톤 인스턴스
export const env = getEnvConfig();

