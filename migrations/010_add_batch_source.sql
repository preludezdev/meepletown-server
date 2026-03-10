-- BGG 배치 소스 추가: hot = Hot List API (~50개), csv = boardgames_ranks_top3000.csv (최대 3000개)
INSERT IGNORE INTO settings (`key`, `value`) VALUES
  ('bgg_batch_source', 'csv');
