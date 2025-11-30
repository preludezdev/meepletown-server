import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// Express 앱 생성
const app: Application = express();

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱

// Health check 엔드포인트
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'MeepleTown Server is running' });
});

// API 라우터 설정
app.use('/api/v1', routes);

// 404 핸들러 (라우터 이후에 배치)
app.use(notFoundHandler);

// 에러 핸들러 (가장 마지막에 배치)
app.use(errorHandler);

export default app;

