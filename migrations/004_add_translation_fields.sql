-- MeepleOn 게임 번역 관련 필드 추가
-- Papago API를 사용한 한국어 번역 시스템

ALTER TABLE games
-- 한국어 번역 필드
ADD COLUMN descriptionKo TEXT COMMENT '한국어 게임 설명 (Papago 번역)',
ADD COLUMN translatedAt TIMESTAMP NULL COMMENT '번역 완료 시각',

-- 인기도 점수 (향후 자동화 시 사용 가능)
ADD COLUMN popularityScore INT DEFAULT 0 COMMENT '인기도 점수 (owned, wishing, bggRankOverall 기반)';

-- 인덱스 추가 (번역 대기열 및 인기도 정렬용)
ALTER TABLE games
ADD INDEX idx_translatedAt (translatedAt),
ADD INDEX idx_popularityScore (popularityScore);

-- 번역 통계 테이블 (비용 추적용)
CREATE TABLE IF NOT EXISTS translationStats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  yearMonth VARCHAR(7) NOT NULL COMMENT '연월 (YYYY-MM)',
  totalCharacters INT DEFAULT 0 COMMENT '번역한 총 문자 수',
  totalGames INT DEFAULT 0 COMMENT '번역한 게임 수',
  cost DECIMAL(10,2) DEFAULT 0 COMMENT '예상 비용 (원)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_yearMonth (yearMonth)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
