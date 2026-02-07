-- MeepleOn 게임 테이블에 누락된 BGG API 필드 추가
-- 제작진 정보, 난이도, 커뮤니티 통계 등

ALTER TABLE games
-- 대체 이름 (다른 언어/에디션)
ADD COLUMN alternateNames TEXT COMMENT 'JSON 배열: 대체 이름들 (다른 언어/에디션)',

-- 권장 연령
ADD COLUMN minAge INT COMMENT '권장 최소 연령',

-- 제작진 정보 (JSON 배열로 저장)
ADD COLUMN designers TEXT COMMENT 'JSON 배열: [{id, name}] 디자이너 목록',
ADD COLUMN artists TEXT COMMENT 'JSON 배열: [{id, name}] 아티스트 목록',
ADD COLUMN publishers TEXT COMMENT 'JSON 배열: [{id, name}] 퍼블리셔 목록',

-- 평점/난이도 상세
ADD COLUMN averageWeight DECIMAL(4,2) COMMENT '평균 난이도 (0-5, BGG averageweight)',
ADD COLUMN usersRated INT COMMENT 'BGG에서 평가한 유저 수',

-- 커뮤니티 통계
ADD COLUMN owned INT COMMENT 'BGG에서 소유한 유저 수',
ADD COLUMN trading INT COMMENT 'BGG에서 교환 희망 유저 수',
ADD COLUMN wanting INT COMMENT 'BGG에서 구매 희망 유저 수',
ADD COLUMN wishing INT COMMENT 'BGG에서 위시리스트에 담은 유저 수',
ADD COLUMN numComments INT COMMENT 'BGG 댓글 수',
ADD COLUMN numWeights INT COMMENT 'BGG 난이도 투표 수';

-- 인덱스 추가 (검색 성능 향상)
ALTER TABLE games
ADD INDEX idx_minAge (minAge),
ADD INDEX idx_averageWeight (averageWeight),
ADD INDEX idx_owned (owned),
ADD INDEX idx_wishing (wishing);
