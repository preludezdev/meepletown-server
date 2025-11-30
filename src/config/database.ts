import mysql from 'mysql2/promise';
import { env } from './env';

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 연결 테스트
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL 데이터베이스 연결 성공');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL 데이터베이스 연결 실패:', error);
    throw error;
  }
};

// 연결 풀 export
export default pool;

