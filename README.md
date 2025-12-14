# MeepleTown Server v1

MeepleTown 백엔드 서버 v1 - 게임 상세 정보 및 평점 기능 추가

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (카페24 MySQL 호스팅)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=meepletown_db

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Google OAuth (optional, 구글 로그인 사용 시)
GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. 데이터베이스 설정

MySQL 데이터베이스를 생성하고 마이그레이션을 실행하세요:

```bash
# 데이터베이스 생성 (MySQL 클라이언트에서)
CREATE DATABASE meepletown_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 마이그레이션 실행
mysql -u your_db_user -p meepletown_db < migrations/001_initial_schema.sql
mysql -u your_db_user -p meepletown_db < migrations/002_add_game_tables.sql
```

### 4. 서버 실행

```bash
# 개발 모드 (hot reload)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 📁 프로젝트 구조

```
meepletown-server/
├── src/
│   ├── config/          # 설정 파일 (DB, 환경변수)
│   ├── models/          # 타입 정의 (User, Listing, Game, GameRating, GameReview)
│   ├── repositories/    # DB 접근 레이어
│   ├── services/        # 비즈니스 로직 레이어
│   ├── controllers/     # HTTP 레벨 로직
│   ├── routes/          # Express 라우터
│   ├── middlewares/     # 미들웨어 (인증, 에러 핸들링)
│   ├── utils/           # 유틸리티 함수
│   ├── app.ts           # Express 앱 설정
│   └── server.ts        # 서버 진입점
├── migrations/          # DB 마이그레이션 SQL
├── .env                 # 환경변수 (gitignore)
├── package.json
├── tsconfig.json
└── README.md
```

## 🌐 API 엔드포인트

기본 URL: `/api/v1`

### 인증 (Auth)
- `POST /api/v1/auth/google` - 구글 로그인
  - Body: `{ "accessToken": "구글_액세스_토큰" }`
- `GET /api/v1/auth/me` - 현재 사용자 정보 (인증 필요)

### 홈 (Home)
- `GET /api/v1/home/today-listings` - 오늘의 매물 조회 (비로그인 허용)
  - Query: `?limit=20` (기본값: 20)

### 사용자 (Users)
- `GET /api/v1/users/:id` - 사용자 조회 (비로그인 허용)
- `GET /api/v1/users/me/listings` - 내 매물 목록 (인증 필요)

### 게임 (Games) - 🆕
- `GET /api/v1/games/:bggId` - 게임 상세 조회 (비로그인 허용)
  - BGG 데이터 + 미플온 평점 통합 조회
  - 로그인 시 사용자의 평가 여부 포함
- `GET /api/v1/games/:bggId/ratings` - 게임 평가 목록 조회 (비로그인 허용)
  - Query: `?page=1&pageSize=20`
- `POST /api/v1/games/:bggId/ratings` - 게임 평가 등록 (인증 필요)
  - Body: `{ "rating": 8.5, "comment": "재미있어요!" }`
- `PATCH /api/v1/games/:bggId/ratings/:ratingId` - 게임 평가 수정 (인증 필요)
  - Body: `{ "rating": 9.0, "comment": "정말 최고!" }`
- `DELETE /api/v1/games/:bggId/ratings/:ratingId` - 게임 평가 삭제 (인증 필요)
- `POST /api/v1/games/sync/:bggId` - 게임 동기화 (수동 실행)
- `POST /api/v1/games/sync` - 여러 게임 동기화
  - Body: `{ "bggIds": [174430, 167791, ...] }`

### 중고거래 (Listings)
- `GET /api/v1/listings` - 매물 목록 조회 (비로그인 허용)
  - Query: `?gameName=게임명&method=direct|delivery&sort=latest&page=1&pageSize=20`
- `GET /api/v1/listings/:id` - 매물 상세 조회 (비로그인 허용)
- `POST /api/v1/listings` - 매물 등록 (인증 필요)
  - Body: `{ "gameBggId": 174430, "price": 50000, "method": "direct", "region": "서울", ... }`
  - 또는: `{ "gameName": "글룸헤이븐", "price": 50000, ... }` (레거시 호환)
- `POST /api/v1/listings/:id/images` - 매물 이미지 추가 (인증 필요, 최대 3장)
- `PATCH /api/v1/listings/:id/status` - 매물 상태 변경 (인증 필요)
- `DELETE /api/v1/listings/:id` - 매물 삭제 (인증 필요)

## 🔐 인증

JWT 토큰을 사용합니다. 구글 로그인 후 받은 JWT 토큰을 `Authorization` 헤더에 Bearer 토큰으로 포함해야 합니다:

```
Authorization: Bearer <your_jwt_token>
```

### 구글 로그인 플로우

1. 클라이언트에서 Google OAuth 인증 완료 후 `accessToken` 받기
2. 서버에 `POST /api/v1/auth/google`로 `accessToken` 전송
3. 서버에서 구글 API로 사용자 정보 조회
4. DB에 사용자 저장/조회 후 JWT 토큰 발급
5. 클라이언트에서 JWT 토큰 저장 후 API 호출 시 사용

## 📝 응답 포맷

모든 응답은 다음 형식을 따릅니다:

### 성공 응답
```json
{
  "success": true,
  "data": { ... }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

## 📊 데이터 구조

### Users
- `id`: 사용자 ID
- `nickname`: 닉네임
- `avatar`: 프로필 이미지 URL
- `socialId`: 소셜 로그인 ID
- `socialType`: 소셜 타입 (google)

### Games (BGG 데이터)
- `id`: 내부 게임 ID
- `bggId`: BGG 게임 ID
- `nameKo`, `nameEn`: 한국어/영문 이름
- `yearPublished`: 출시 연도
- `minPlayers`, `maxPlayers`, `bestPlayerCount`: 플레이어 수
- `minPlaytime`, `maxPlaytime`: 플레이타임
- `description`: 게임 설명
- `imageUrl`, `thumbnailUrl`: 이미지
- `bggRating`: BGG 평점
- `meepleonRating`: 미플온 평점
- `ratingCount`: 미플온 평가 수
- `bggRankOverall`, `bggRankStrategy`: BGG 순위

### GameRatings (미플온 평점)
- `id`: 평가 ID
- `userId`: 사용자 ID
- `gameId`: 게임 ID
- `rating`: 평점 (0-10)
- `comment`: 평가 코멘트

### Listings
- `id`: 매물 ID
- `userId`: 판매자 ID
- `gameId`: 게임 ID (games 테이블 참조)
- `gameName`: 게임명 (레거시 호환용)
- `title`: 제목 (옵션)
- `price`: 가격
- `method`: 거래방식 (direct=직거래, delivery=택배)
- `region`: 지역
- `description`: 설명 (옵션)
- `contactLink`: 연락 링크
- `status`: 상태 (selling=판매중, sold=판매완료)

## 🎯 v1 주요 기능

### 새로 추가된 기능
- ✅ 구글 소셜 로그인 (카카오 → 구글 전환)
- ✅ BGG 게임 데이터 동기화 (XML API2)
- ✅ 게임 상세 정보 조회 (BGG + 미플온 데이터 통합)
- ✅ 미플온 평점 시스템 (등록, 수정, 삭제, 조회)
- ✅ 게임 카테고리/메커니즘 매핑
- ✅ 자동 동기화 스케줄러 (매일 새벽 3시 BGG Hot List)
- ✅ Listing과 Game 연결 (gameBggId 지원)

### 기존 기능 (v0)
- ✅ 비로그인 열람 전체 허용
- ✅ 홈: 오늘의 매물 리스트
- ✅ 중고거래: 리스트(필터, 정렬), 상세, 등록, 상태변경
- ✅ 마이: 내 매물 목록 + 상태변경
- ✅ 이미지 업로드 (최대 3장, URL 방식)

## 🛠 개발 도구

- **TypeScript**: 타입 안전성
- **ts-node-dev**: 개발 시 hot reload
- **MySQL2**: Promise 기반 MySQL 드라이버
- **JWT**: 인증 토큰
- **Axios**: HTTP 클라이언트 (구글 API, BGG API 호출)
- **fast-xml-parser**: XML 파싱 (BGG API)
- **node-cron**: 스케줄러 (자동 동기화)

## 🚂 Railway 배포 가이드

### 1. Railway 계정 생성
1. https://railway.app 접속
2. GitHub 계정으로 로그인

### 2. 프로젝트 생성
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. `preludezdev/meepletown-server` 저장소 선택

### 3. MySQL 데이터베이스 추가
1. 프로젝트 대시보드에서 "New Service" 클릭
2. "Database" → "MySQL" 선택
3. Railway가 자동으로 MySQL 인스턴스 생성 및 연결 정보 제공

### 4. 환경변수 설정
Railway 대시보드 → Variables 탭에서 설정:

**자동 설정됨 (MySQL 서비스 추가 시):**
- `MYSQL_HOST` - 자동 설정
- `MYSQL_PORT` - 자동 설정
- `MYSQL_USER` - 자동 설정
- `MYSQL_PASSWORD` - 자동 설정
- `MYSQL_DATABASE` - 자동 설정
- `PORT` - Railway가 자동 설정

**수동 설정 필요:**
- `NODE_ENV=production`
- `JWT_SECRET` - 로컬에서 생성한 값 사용:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- `JWT_EXPIRES_IN=7d` (선택사항)
- `GOOGLE_CLIENT_ID` - 구글 OAuth 클라이언트 ID

### 5. 데이터베이스 마이그레이션
Railway MySQL 서비스의 "Connect" 탭에서 연결 정보 확인 후:

```bash
# Railway MySQL에 연결하여 마이그레이션 실행
mysql -h [MYSQL_HOST] -P [MYSQL_PORT] -u [MYSQL_USER] -p[MYSQL_PASSWORD] [MYSQL_DATABASE] < migrations/001_initial_schema.sql
mysql -h [MYSQL_HOST] -P [MYSQL_PORT] -u [MYSQL_USER] -p[MYSQL_PASSWORD] [MYSQL_DATABASE] < migrations/002_add_game_tables.sql
```

또는 Railway MySQL 서비스의 "Data" 탭에서 직접 SQL 실행 가능

### 6. 배포 확인
- Railway가 자동으로 빌드 및 배포
- 배포 완료 후 제공되는 URL로 접속 테스트
- Health check: `https://your-app.railway.app/health`

## 📌 주의사항

1. **환경변수**: `.env` 파일은 절대 커밋하지 마세요
2. **비밀번호**: 프로덕션에서는 강력한 JWT_SECRET 사용
3. **BGG API**: Rate limit이 있으므로 요청 간 딜레이(1초) 필요
4. **게임 동기화**: 매일 새벽 3시 자동 동기화 (BGG Hot List)
5. **중고거래 등록**: `gameBggId` 제공 시 자동으로 게임 정보 동기화
6. **에러 처리**: 모든 에러는 적절한 HTTP 상태 코드와 함께 반환됩니다
7. **Railway MySQL**: Railway MySQL 서비스 추가 시 `MYSQL_*` 환경변수가 자동으로 설정됩니다

## 📚 참고 자료

- [Express.js 공식 문서](https://expressjs.com/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/)
- [MySQL2 문서](https://github.com/sidorares/node-mysql2)
- [BoardGameGeek XML API2](https://boardgamegeek.com/wiki/page/BGG_XML_API2)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## 🔄 마이그레이션 이력

- `001_initial_schema.sql`: 초기 스키마 (Users, Listings, ListingImages)
- `002_add_game_tables.sql`: 게임 관련 테이블 추가 (Games, GameCategories, GameMechanisms, GameRatings, GameReviews, 매핑 테이블)
