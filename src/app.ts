import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';

// Express 앱 생성
const app: Application = express();

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱

// Swagger API 문서
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MeepleOn API Docs',
}));

// 어드민 페이지 정적 파일 서빙 (public/ 디렉토리는 프로젝트 루트에 위치)
// 개발: __dirname = src/ → ../public/admin = <root>/public/admin
// 프로덕션: __dirname = dist/ → ../public/admin = <root>/public/admin
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Health check 엔드포인트
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: env.appEnv,
    message: 'MeepleOn Server is running',
  });
});

// API 라우터 설정
app.use('/api/v1', routes);

// 404 핸들러 (라우터 이후에 배치)
app.use(notFoundHandler);

// 에러 핸들러 (가장 마지막에 배치)
app.use(errorHandler);

export default app;

