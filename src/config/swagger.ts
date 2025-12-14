import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MeepleOn API',
      version: '1.0.0',
      description: '미플온 백엔드 API 문서 - 보드게임 중고거래 및 정보 플랫폼',
      contact: {
        name: 'MeepleOn',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: '로컬 개발 서버',
      },
      {
        url: 'https://meepleon-server-production.up.railway.app',
        description: 'Production 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'], // 라우트 파일들
};

export const swaggerSpec = swaggerJsdoc(options);

