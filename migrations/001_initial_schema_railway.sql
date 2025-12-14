-- MeepleTown v0 초기 스키마 생성 (Railway용)
-- Railway는 'railway' 데이터베이스를 기본 사용

-- Users 테이블 (소셜 로그인 기반)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nickname VARCHAR(100) NOT NULL,
  avatar VARCHAR(500) COMMENT '프로필 이미지 URL',
  socialId VARCHAR(255) NOT NULL COMMENT '소셜 로그인 ID (카카오 등)',
  socialType ENUM('kakao', 'google') DEFAULT 'kakao',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_social (socialId, socialType),
  INDEX idx_socialId (socialId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listings 테이블 (중고거래 매물)
CREATE TABLE IF NOT EXISTS listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  gameName VARCHAR(255) NOT NULL COMMENT '게임명 (문자열)',
  title VARCHAR(255) COMMENT '제목 (옵션)',
  price INT NOT NULL COMMENT '가격',
  method ENUM('direct', 'delivery') NOT NULL COMMENT '거래방식: direct=직거래, delivery=택배',
  region VARCHAR(100) COMMENT '지역',
  description TEXT COMMENT '설명 (옵션)',
  contactLink VARCHAR(500) COMMENT '연락 링크 (카톡 오픈채팅/전화/문자)',
  status ENUM('selling', 'sold') DEFAULT 'selling' COMMENT '판매중/판매완료',
  isHidden BOOLEAN DEFAULT FALSE COMMENT '관리자 숨김 플래그',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_gameName (gameName),
  INDEX idx_method (method),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt),
  INDEX idx_isHidden (isHidden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listing Images 테이블 (매물 사진, 최대 3장)
CREATE TABLE IF NOT EXISTS listingImages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listingId INT NOT NULL,
  url VARCHAR(500) NOT NULL COMMENT '이미지 URL',
  orderIndex INT NOT NULL DEFAULT 0 COMMENT '순서 (0, 1, 2)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listingId) REFERENCES listings(id) ON DELETE CASCADE,
  INDEX idx_listingId (listingId),
  INDEX idx_order (orderIndex)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

