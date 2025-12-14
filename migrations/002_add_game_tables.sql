-- MeepleTown 게임 관련 테이블 추가
-- Railway 자동 마이그레이션용 (USE 구문 제거)

-- Games 테이블 (BGG 게임 데이터)
CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bggId INT NOT NULL UNIQUE COMMENT 'BGG 게임 ID (고유)',
  nameKo VARCHAR(255) COMMENT '한국어 게임명',
  nameEn VARCHAR(255) NOT NULL COMMENT '영문 게임명',
  yearPublished INT COMMENT '출시 연도',
  minPlayers INT COMMENT '최소 플레이어 수',
  maxPlayers INT COMMENT '최대 플레이어 수',
  bestPlayerCount INT COMMENT '최적 플레이어 수',
  minPlaytime INT COMMENT '최소 플레이타임 (분)',
  maxPlaytime INT COMMENT '최대 플레이타임 (분)',
  description TEXT COMMENT '게임 설명',
  imageUrl VARCHAR(500) COMMENT '게임 이미지 URL',
  thumbnailUrl VARCHAR(500) COMMENT '썸네일 이미지 URL',
  bggRating DECIMAL(4,2) COMMENT 'BGG 평점 (0-10)',
  meepleonRating DECIMAL(4,2) COMMENT '미플온 평점 (0-10)',
  ratingCount INT DEFAULT 0 COMMENT '미플온 평가 수',
  bggRankOverall INT COMMENT 'BGG 전체 순위',
  bggRankStrategy INT COMMENT 'BGG 전략 게임 순위',
  lastSyncedAt TIMESTAMP NULL COMMENT '마지막 BGG 동기화 시간',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bggId (bggId),
  INDEX idx_nameKo (nameKo),
  INDEX idx_nameEn (nameEn),
  INDEX idx_meepleonRating (meepleonRating),
  INDEX idx_yearPublished (yearPublished)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GameCategories 테이블 (게임 카테고리)
CREATE TABLE IF NOT EXISTS gameCategories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bggCategoryId INT NOT NULL UNIQUE COMMENT 'BGG 카테고리 ID',
  nameEn VARCHAR(100) NOT NULL COMMENT '영문 카테고리명',
  nameKo VARCHAR(100) COMMENT '한국어 카테고리명',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bggCategoryId (bggCategoryId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GameMechanisms 테이블 (게임 메커니즘)
CREATE TABLE IF NOT EXISTS gameMechanisms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bggMechanismId INT NOT NULL UNIQUE COMMENT 'BGG 메커니즘 ID',
  nameEn VARCHAR(100) NOT NULL COMMENT '영문 메커니즘명',
  nameKo VARCHAR(100) COMMENT '한국어 메커니즘명',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bggMechanismId (bggMechanismId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GameCategoryMappings 테이블 (게임-카테고리 N:N)
CREATE TABLE IF NOT EXISTS gameCategoryMappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gameId INT NOT NULL,
  categoryId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES gameCategories(id) ON DELETE CASCADE,
  UNIQUE KEY uk_game_category (gameId, categoryId),
  INDEX idx_gameId (gameId),
  INDEX idx_categoryId (categoryId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GameMechanismMappings 테이블 (게임-메커니즘 N:N)
CREATE TABLE IF NOT EXISTS gameMechanismMappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gameId INT NOT NULL,
  mechanismId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (mechanismId) REFERENCES gameMechanisms(id) ON DELETE CASCADE,
  UNIQUE KEY uk_game_mechanism (gameId, mechanismId),
  INDEX idx_gameId (gameId),
  INDEX idx_mechanismId (mechanismId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GameRatings 테이블 (미플온 평점)
CREATE TABLE IF NOT EXISTS gameRatings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  gameId INT NOT NULL,
  rating DECIMAL(3,1) NOT NULL COMMENT '평점 (0-10)',
  comment TEXT COMMENT '평가 코멘트',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_game (userId, gameId) COMMENT '한 사용자당 한 게임에 하나의 평가',
  INDEX idx_gameId (gameId),
  INDEX idx_userId (userId),
  INDEX idx_rating (rating),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GameReviews 테이블 (게임 후기)
CREATE TABLE IF NOT EXISTS gameReviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  gameId INT NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT '후기 제목',
  content TEXT NOT NULL COMMENT '후기 내용',
  helpfulCount INT DEFAULT 0 COMMENT '도움됨 수',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
  INDEX idx_gameId (gameId),
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_helpfulCount (helpfulCount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listings 테이블에 gameId 컬럼 추가
ALTER TABLE listings
ADD COLUMN gameId INT NULL COMMENT '게임 ID (games 테이블 참조)' AFTER userId,
ADD INDEX idx_gameId (gameId),
ADD CONSTRAINT fk_listings_gameId FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE SET NULL;

-- gameName은 레거시 호환용으로 유지

