# MeepleTown Server v0

MeepleTown 백엔드 서버 v0 - 중고거래 최소 기능 버전

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
```

### 3. 데이터베이스 설정

MySQL 데이터베이스를 생성하고 마이그레이션을 실행하세요:

```bash
# 데이터베이스 생성 (MySQL 클라이언트에서)
CREATE DATABASE meepletown_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 마이그레이션 실행
mysql -u your_db_user -p meepletown_db < migrations/001_initial_schema.sql
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
│   ├── models/           # 타입 정의 (User, Listing, ListingImage)
│   ├── repositories/     # DB 접근 레이어
│   ├── services/         # 비즈니스 로직 레이어
│   ├── controllers/      # HTTP 레벨 로직
│   ├── routes/           # Express 라우터
│   ├── middlewares/      # 미들웨어 (인증, 에러 핸들링)
│   ├── utils/            # 유틸리티 함수
│   ├── app.ts            # Express 앱 설정
│   └── server.ts         # 서버 진입점
├── migrations/           # DB 마이그레이션 SQL
├── .env                  # 환경변수 (gitignore)
├── package.json
├── tsconfig.json
└── README.md
```

## 🌐 API 엔드포인트

기본 URL: `/api/v1`

### 인증 (Auth)
- `POST /api/v1/auth/kakao` - 카카오 로그인
  - Body: `{ "accessToken": "카카오_액세스_토큰" }`
- `GET /api/v1/auth/me` - 현재 사용자 정보 (인증 필요)

### 홈 (Home)
- `GET /api/v1/home/today-listings` - 오늘의 매물 조회 (비로그인 허용)
  - Query: `?limit=20` (기본값: 20)

### 사용자 (Users)
- `GET /api/v1/users/:id` - 사용자 조회 (비로그인 허용)
- `GET /api/v1/users/me/listings` - 내 매물 목록 (인증 필요)

### 중고거래 (Listings)
- `GET /api/v1/listings` - 매물 목록 조회 (비로그인 허용)
  - Query: `?gameName=게임명&method=direct|delivery&sort=latest&page=1&pageSize=20`
- `GET /api/v1/listings/:id` - 매물 상세 조회 (비로그인 허용)
- `POST /api/v1/listings` - 매물 등록 (인증 필요)
  - Body: `{ "gameName": "게임명", "price": 10000, "method": "direct|delivery", "region": "서울", "title": "제목(옵션)", "description": "설명(옵션)", "contactLink": "연락링크(옵션)" }`
- `POST /api/v1/listings/:id/images` - 매물 이미지 추가 (인증 필요, 최대 3장)
  - Body: `{ "images": [{ "url": "이미지URL", "orderIndex": 0 }, ...] }`
- `PATCH /api/v1/listings/:id/status` - 매물 상태 변경 (인증 필요)
  - Body: `{ "status": "selling|sold" }`
- `DELETE /api/v1/listings/:id` - 매물 삭제 (인증 필요)

## 🔐 인증

JWT 토큰을 사용합니다. 카카오 로그인 후 받은 JWT 토큰을 `Authorization` 헤더에 Bearer 토큰으로 포함해야 합니다:

```
Authorization: Bearer <your_jwt_token>
```

### 카카오 로그인 플로우

1. 클라이언트에서 카카오 OAuth 인증 완료 후 `accessToken` 받기
2. 서버에 `POST /api/v1/auth/kakao`로 `accessToken` 전송
3. 서버에서 카카오 API로 사용자 정보 조회
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
- `socialType`: 소셜 타입 (kakao, google)

### Listings
- `id`: 매물 ID
- `userId`: 판매자 ID
- `gameName`: 게임명 (문자열)
- `title`: 제목 (옵션)
- `price`: 가격
- `method`: 거래방식 (direct=직거래, delivery=택배)
- `region`: 지역
- `description`: 설명 (옵션)
- `contactLink`: 연락 링크 (카톡 오픈채팅/전화/문자)
- `status`: 상태 (selling=판매중, sold=판매완료)
- `isHidden`: 관리자 숨김 플래그

### ListingImages
- `id`: 이미지 ID
- `listingId`: 매물 ID
- `url`: 이미지 URL
- `orderIndex`: 순서 (0, 1, 2)

## 🎯 v0 기능 범위

### 포함된 기능
- ✅ 비로그인 열람 전체 허용
- ✅ 카카오 소셜 로그인
- ✅ 홈: 오늘의 매물 리스트
- ✅ 중고거래: 리스트(필터, 정렬), 상세, 등록, 상태변경
- ✅ 마이: 내 매물 목록 + 상태변경
- ✅ 이미지 업로드 (최대 3장, URL 방식)

### 제외된 기능 (v1로 이월)
- ❌ 검색 (텍스트 검색)
- ❌ 예약중 상태
- ❌ 리뷰/평점
- ❌ 미니샵
- ❌ 프로필 커뮤니티
- ❌ 푸시알림
- ❌ 북마크/좋아요
- ❌ 신고/운영툴
- ❌ 포럼/콘텐츠 글쓰기

## 🛠 개발 도구

- **TypeScript**: 타입 안전성
- **ts-node-dev**: 개발 시 hot reload
- **MySQL2**: Promise 기반 MySQL 드라이버
- **JWT**: 인증 토큰
- **Axios**: HTTP 클라이언트 (카카오 API 호출)

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

### 5. 데이터베이스 마이그레이션
Railway MySQL 서비스의 "Connect" 탭에서 연결 정보 확인 후:

```bash
# Railway MySQL에 연결하여 마이그레이션 실행
mysql -h [MYSQL_HOST] -P [MYSQL_PORT] -u [MYSQL_USER] -p[MYSQL_PASSWORD] [MYSQL_DATABASE] < migrations/001_initial_schema.sql
```

또는 Railway MySQL 서비스의 "Data" 탭에서 직접 SQL 실행 가능

### 6. 배포 확인
- Railway가 자동으로 빌드 및 배포
- 배포 완료 후 제공되는 URL로 접속 테스트
- Health check: `https://your-app.railway.app/health`

## 📌 주의사항

1. **환경변수**: `.env` 파일은 절대 커밋하지 마세요
2. **비밀번호**: 프로덕션에서는 강력한 JWT_SECRET 사용
3. **이미지 업로드**: 현재는 URL을 받는 방식입니다. 실제 파일 업로드를 원하면 multer 등을 추가해야 합니다.
4. **카카오 로그인**: 카카오 개발자 콘솔에서 앱을 등록하고 Redirect URI를 설정해야 합니다.
5. **에러 처리**: 모든 에러는 적절한 HTTP 상태 코드와 함께 반환됩니다.
6. **Railway MySQL**: Railway MySQL 서비스 추가 시 `MYSQL_*` 환경변수가 자동으로 설정됩니다. 코드는 Railway와 일반 환경변수 모두 지원합니다.

## 📚 참고 자료

- [Express.js 공식 문서](https://expressjs.com/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/)
- [MySQL2 문서](https://github.com/sidorares/node-mysql2)
- [카카오 로그인 REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
