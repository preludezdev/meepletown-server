-- settings 테이블: key-value 기반 운영 설정
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BGG 배치 기본값
INSERT INTO settings (`key`, `value`) VALUES
  ('bgg_batch_enabled', 'true'),
  ('bgg_batch_hour', '3'),
  ('bgg_batch_size', '50')
;
