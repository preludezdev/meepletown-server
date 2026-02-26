-- 포럼 임시 시드 데이터 (users/games 레코드가 있을 때만 삽입)

-- 게임포럼 글 3건 (games 테이블 첫 번째 게임 사용)
INSERT INTO posts (userId, boardType, gameId, category, title, contentBlocks, isDraft, viewCount, likeCount, commentCount, createdAt, updatedAt)
SELECT
  u.id,
  'game_forum',
  g.id,
  '리뷰',
  '처음 해봤는데 생각보다 너무 재밌어요',
  '[{"type":"text","value":"어제 친구들이랑 처음 해봤는데 생각보다 훨씬 재밌더라고요. 전략적인 요소가 많아서 처음엔 어렵게 느껴졌는데 두 판 정도 하고 나니까 감이 잡히기 시작했어요. 다음에 또 하고 싶어요!"}]',
  0,
  42,
  15,
  3,
  NOW() - INTERVAL 2 HOUR,
  NOW() - INTERVAL 30 MINUTE
FROM (SELECT id FROM users ORDER BY id LIMIT 1) u,
     (SELECT id FROM games ORDER BY id LIMIT 1) g
WHERE EXISTS (SELECT 1 FROM users LIMIT 1)
  AND EXISTS (SELECT 1 FROM games LIMIT 1);

INSERT INTO posts (userId, boardType, gameId, category, title, contentBlocks, isDraft, viewCount, likeCount, commentCount, createdAt, updatedAt)
SELECT
  u.id,
  'game_forum',
  g.id,
  '질문',
  '이 카드 효과 해석이 맞나요?',
  '[{"type":"text","value":"3번 카드에 적힌 효과가 헷갈려서요. \'이번 라운드에 획득한 자원을 두 배로 한다\'는 게 이미 획득한 자원에도 적용되는 건가요, 아니면 이 카드 이후에 획득하는 자원에만 적용되는 건가요? 규칙서를 봤는데도 명확하지 않아서 질문드립니다."}]',
  0,
  18,
  4,
  7,
  NOW() - INTERVAL 5 HOUR,
  NOW() - INTERVAL 1 HOUR
FROM (SELECT id FROM users ORDER BY id LIMIT 1) u,
     (SELECT id FROM games ORDER BY id LIMIT 1) g
WHERE EXISTS (SELECT 1 FROM users LIMIT 1)
  AND EXISTS (SELECT 1 FROM games LIMIT 1);

INSERT INTO posts (userId, boardType, gameId, category, title, contentBlocks, isDraft, viewCount, likeCount, commentCount, createdAt, updatedAt)
SELECT
  u.id,
  'game_forum',
  g.id,
  '공략',
  '초반 자원 확보가 핵심입니다',
  '[{"type":"text","value":"여러 번 플레이해보니까 초반 3라운드 안에 자원을 최대한 많이 확보하는 게 승패를 좌우하더라고요. 특히 목재와 철광은 우선순위를 높게 가져가는 게 좋고, 초반에 행동 카드보다는 자원 카드 위주로 뽑는 전략을 추천합니다. 중반 이후에는 자연스럽게 행동 카드로 전환하면 됩니다."}]',
  0,
  87,
  31,
  12,
  NOW() - INTERVAL 1 DAY,
  NOW() - INTERVAL 3 HOUR
FROM (SELECT id FROM users ORDER BY id LIMIT 1) u,
     (SELECT id FROM games ORDER BY id LIMIT 1) g
WHERE EXISTS (SELECT 1 FROM users LIMIT 1)
  AND EXISTS (SELECT 1 FROM games LIMIT 1);

-- 자유게시판 글 3건
INSERT INTO posts (userId, boardType, gameId, category, title, contentBlocks, isDraft, viewCount, likeCount, commentCount, createdAt, updatedAt)
SELECT
  u.id,
  'free_board',
  NULL,
  '유머',
  '보드게이머들이 통장이 얇아지는 이유',
  '[{"type":"text","value":"1. 신작 나왔다는 유튜브 영상 발견\n2. \'이건 꼭 해봐야해\' 다짐\n3. 배송비 아까우니까 다른 것도 같이 주문\n4. 박스 쌓여가는 거 보면서 뿌듯함\n5. 새로운 신작 나왔다는 유튜브 영상 발견\n\n이 굴레에서 벗어날 수가 없습니다 😂"}]',
  0,
  321,
  89,
  33,
  NOW() - INTERVAL 12 HOUR,
  NOW() - INTERVAL 12 HOUR
FROM (SELECT id FROM users ORDER BY id LIMIT 1) u
WHERE EXISTS (SELECT 1 FROM users LIMIT 1);

INSERT INTO posts (userId, boardType, gameId, category, title, contentBlocks, isDraft, viewCount, likeCount, commentCount, createdAt, updatedAt)
SELECT
  u.id,
  'free_board',
  NULL,
  '잡담',
  '이번 주 크라우드펀딩이 너무 많이 열려서...',
  '[{"type":"text","value":"이번 주에 눈에 띄는 크라우드펀딩이 한꺼번에 4개나 열렸어요. 다 하고 싶은데 통장 사정이... 여러분은 어떻게 우선순위 정하세요? 저는 주로 리뷰어들 플레이 영상 보고 결정하긴 하는데, 이번엔 다들 너무 좋다고 해서 더 고민이에요."}]',
  0,
  156,
  27,
  18,
  NOW() - INTERVAL 1 DAY,
  NOW() - INTERVAL 6 HOUR
FROM (SELECT id FROM users ORDER BY id LIMIT 1) u
WHERE EXISTS (SELECT 1 FROM users LIMIT 1);

INSERT INTO posts (userId, boardType, gameId, category, title, contentBlocks, isDraft, viewCount, likeCount, commentCount, createdAt, updatedAt)
SELECT
  u.id,
  'free_board',
  NULL,
  '모임후기',
  '어제 보드게임 모임 후기 (6인 풀방!)',
  '[{"type":"text","value":"드디어 6인 풀방으로 플레이했어요! 인원이 많다 보니까 대기 시간이 좀 있었지만 그래도 즐거운 시간이었습니다. 첫 번째로 웰컴투 했는데 역시 입문용으로는 최고인 것 같아요. 두 번째는 아줄을 했는데 처음 하는 분도 금방 적응하더라고요. 다음 달에 또 모이기로 했는데 그때는 빌리지 도전해보려고요!"}]',
  0,
  98,
  41,
  22,
  NOW() - INTERVAL 2 DAY,
  NOW() - INTERVAL 2 DAY
FROM (SELECT id FROM users ORDER BY id LIMIT 1) u
WHERE EXISTS (SELECT 1 FROM users LIMIT 1);
