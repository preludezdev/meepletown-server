CREATE TABLE IF NOT EXISTS posts (
  id            INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId        INT           NOT NULL,
  boardType     ENUM('game_forum', 'free_board') NOT NULL,
  gameId        INT           NULL,
  category      ENUM('소식','리뷰','자료','질문','공략','유머','잡담','창작','모임후기') NOT NULL,
  title         VARCHAR(200)  NOT NULL,
  contentBlocks JSON          NOT NULL,
  isDraft       TINYINT(1)    NOT NULL DEFAULT 0,
  viewCount     INT           NOT NULL DEFAULT 0,
  likeCount     INT           NOT NULL DEFAULT 0,
  commentCount  INT           NOT NULL DEFAULT 0,
  createdAt     DATETIME      NOT NULL DEFAULT NOW(),
  updatedAt     DATETIME      NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
