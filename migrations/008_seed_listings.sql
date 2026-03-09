-- 중고거래 매물 시드 데이터 (테스트/스테이징용)
-- 판매자용 유저 4명 생성 후 매물 8건 삽입

-- 1. 판매자 유저 4명 생성 (이미 존재하면 건너뜀)
INSERT IGNORE INTO users (nickname, avatar, socialId, socialType) VALUES
('포도나무', NULL, 'seed_listing_user_1', 'google'),
('보드게이머A', NULL, 'seed_listing_user_2', 'google'),
('미플사랑', NULL, 'seed_listing_user_3', 'google'),
('BirdWatcher', NULL, 'seed_listing_user_4', 'google'),
('보드게임하는기석', NULL, 'seed_listing_user_5', 'google');

-- 2. 매물 8건 삽입 (위 유저들이 있을 때만)
INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink, status, isHidden, createdAt, updatedAt)
SELECT u.id, NULL, '아말피 : 르네상스', '한글판/1회 플레이/프로텍터 완료', 48000, 'direct', '서울',
'미개봉 새상품입니다. 비닐 포장 그대로 유지 중이에요.
친구들과 하려고 여러 개 샀는데 하나가 남아서 판매합니다.
직거래는 강남역 인근 선호하며, 택배 시 3,000원 추가됩니다.
궁금하신 점은 채팅 주세요!',
'https://open.kakao.com/o/example1', 'selling', 0, NOW() - INTERVAL 3 MINUTE, NOW() - INTERVAL 3 MINUTE
FROM users u WHERE u.socialId = 'seed_listing_user_1' AND u.socialType = 'google' LIMIT 1;

INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink, status, isHidden, createdAt, updatedAt)
SELECT u.id, NULL, '테라포밍 마스 + 서베이 확장', '미개봉 새상품입니다. 직거래 선호', 65000, 'delivery', '경기',
'미개봉 새상품입니다. 비닐 포장 그대로 유지 중이에요.
테라포밍 마스는 최고의 경영 시뮬레이션 게임이죠!
택배거래만 가능하며, 박스 훼손 없이 신중하게 발송하겠습니다.
궁금하신 점은 채팅 주세요!',
'https://open.kakao.com/o/example2', 'selling', 0, NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 15 MINUTE
FROM users u WHERE u.socialId = 'seed_listing_user_2' AND u.socialType = 'google' LIMIT 1;

INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink, status, isHidden, createdAt, updatedAt)
SELECT u.id, NULL, '스플렌더 포켓 에디션', '박스 모서리 백화 있음. 구성물은 깨끗', 12000, 'direct', '인천',
'박스 모서리 백화 있음. 구성물은 깨끗합니다.
스플렌더 포켓은 휴대하기 편한 버전이에요.
직거래만 가능합니다. 인천 부평역 인근에서 만나요.
궁금하신 점은 채팅 주세요!',
'https://open.kakao.com/o/example3', 'selling', 0, NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 1 HOUR
FROM users u WHERE u.socialId = 'seed_listing_user_3' AND u.socialType = 'google' LIMIT 1;

INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink, status, isHidden, createdAt, updatedAt)
SELECT u.id, NULL, '윙스팬 (Wingspan)', '코인 캡슐 작업 완료. 3회 플레이', 35000, 'delivery', '부산',
'코인 캡슐 작업 완료. 3회 플레이했고 상태 매우 좋아요.
윙스팬은 조류 수집 테마의 명작 보드게임입니다.
직거래는 부산 해운대 인근, 택배도 가능합니다.
궁금하신 점은 채팅 주세요!',
'https://open.kakao.com/o/example4', 'selling', 0, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR
FROM users u WHERE u.socialId = 'seed_listing_user_4' AND u.socialType = 'google' LIMIT 1;

INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink, status, isHidden, createdAt, updatedAt)
SELECT u.id, NULL, '카탄', '한글판 사용감 약간', 28000, 'direct', '대전',
'2회 플레이. 구성품 모두 완비.', NULL, 'sold', 0, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY
FROM users u WHERE u.socialId = 'seed_listing_user_1' AND u.socialType = 'google' LIMIT 1;

INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink, status, isHidden, createdAt, updatedAt)
SELECT u.id, NULL, '스컬킹', '신규/미개봉', 43000, 'direct', '서울',
'미개봉 새상품입니다. 비닐 포장 그대로 유지 중이에요.
친구들과 하려고 여러 개 샀는데 하나가 남아서 판매합니다.
스컬킹은 최고의 트릭테이킹 게임이죠!
직거래는 강남역 인근 선호하며, 택배 시 3,000원 추가됩니다.
궁금하신 점은 채팅 주세요!',
'https://open.kakao.com/o/example5', 'selling', 0, NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 30 MINUTE
FROM users u WHERE u.socialId = 'seed_listing_user_5' AND u.socialType = 'google' LIMIT 1;

INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink, status, isHidden, createdAt, updatedAt)
SELECT u.id, NULL, '글룸헤이븐', '한글판/거의 새것/2회 플레이', 52000, 'delivery', '경기',
'한글판이고 거의 새것입니다. 2회만 플레이했어요.
글룸헤이븐은 인디 로그빌딩 대표작이에요.
택배 발송 시 비닐 포장 신경 써서 보내드립니다.
궁금하신 점은 채팅 주세요!',
'https://open.kakao.com/o/example6', 'selling', 0, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 3 HOUR
FROM users u WHERE u.socialId = 'seed_listing_user_3' AND u.socialType = 'google' LIMIT 1;

INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink, status, isHidden, createdAt, updatedAt)
SELECT u.id, NULL, '카르카손', '기본판/사용감 적음', 25000, 'direct', '대구',
'기본판입니다. 사용감 적고 상태 좋아요.
카르카손은 타일 놓기 게임의 명작!
직거래 선호, 대구 수성구 근처에서 만나요.
궁금하신 점은 채팅 주세요!', NULL, 'selling', 0, NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 5 HOUR
FROM users u WHERE u.socialId = 'seed_listing_user_2' AND u.socialType = 'google' LIMIT 1;
