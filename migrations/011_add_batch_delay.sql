-- BGG API 요청 간 딜레이(ms). rate limit 방지용, 기본 1500
INSERT IGNORE INTO settings (`key`, `value`) VALUES
  ('bgg_request_delay_ms', '1500');
