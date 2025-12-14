import pool from '../config/database';
import { Game, GameRow, GameCategory, GameMechanism, BggGameData } from '../models/Game';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// BGG ID로 게임 조회
export const findGameByBggId = async (bggId: number): Promise<Game | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM games WHERE bggId = ?',
    [bggId]
  );
  return (rows[0] as GameRow) || null;
};

// 내부 ID로 게임 조회
export const findGameById = async (id: number): Promise<Game | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM games WHERE id = ?',
    [id]
  );
  return (rows[0] as GameRow) || null;
};

// 게임 생성
export const createGame = async (gameData: BggGameData): Promise<Game> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO games 
    (bggId, nameEn, nameKo, yearPublished, minPlayers, maxPlayers, minPlaytime, maxPlaytime, 
     description, imageUrl, thumbnailUrl, bggRating, bggRankOverall, bggRankStrategy, lastSyncedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      gameData.bggId,
      gameData.nameEn,
      gameData.nameKo || null,
      gameData.yearPublished || null,
      gameData.minPlayers || null,
      gameData.maxPlayers || null,
      gameData.minPlaytime || null,
      gameData.maxPlaytime || null,
      gameData.description || null,
      gameData.imageUrl || null,
      gameData.thumbnailUrl || null,
      gameData.bggRating || null,
      gameData.bggRankOverall || null,
      gameData.bggRankStrategy || null,
    ]
  );

  const game = await findGameById(result.insertId);
  if (!game) {
    throw new Error('게임 생성 후 조회 실패');
  }
  return game;
};

// 게임 업데이트
export const updateGame = async (id: number, gameData: BggGameData): Promise<Game> => {
  await pool.execute(
    `UPDATE games 
    SET nameEn = ?, nameKo = ?, yearPublished = ?, minPlayers = ?, maxPlayers = ?, 
        minPlaytime = ?, maxPlaytime = ?, description = ?, imageUrl = ?, thumbnailUrl = ?, 
        bggRating = ?, bggRankOverall = ?, bggRankStrategy = ?, lastSyncedAt = NOW()
    WHERE id = ?`,
    [
      gameData.nameEn,
      gameData.nameKo || null,
      gameData.yearPublished || null,
      gameData.minPlayers || null,
      gameData.maxPlayers || null,
      gameData.minPlaytime || null,
      gameData.maxPlaytime || null,
      gameData.description || null,
      gameData.imageUrl || null,
      gameData.thumbnailUrl || null,
      gameData.bggRating || null,
      gameData.bggRankOverall || null,
      gameData.bggRankStrategy || null,
      id,
    ]
  );

  const game = await findGameById(id);
  if (!game) {
    throw new Error('게임 업데이트 후 조회 실패');
  }
  return game;
};

// 게임의 미플온 평점 업데이트
export const updateGameRating = async (
  gameId: number,
  meepleonRating: number,
  ratingCount: number
): Promise<void> => {
  await pool.execute(
    'UPDATE games SET meepleonRating = ?, ratingCount = ? WHERE id = ?',
    [meepleonRating, ratingCount, gameId]
  );
};

// 카테고리 조회 또는 생성
export const findOrCreateCategory = async (
  bggCategoryId: number,
  nameEn: string
): Promise<GameCategory> => {
  // 기존 카테고리 조회
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM gameCategories WHERE bggCategoryId = ?',
    [bggCategoryId]
  );

  if (rows.length > 0) {
    return rows[0] as GameCategory;
  }

  // 새 카테고리 생성
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO gameCategories (bggCategoryId, nameEn) VALUES (?, ?)',
    [bggCategoryId, nameEn]
  );

  const [newRows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM gameCategories WHERE id = ?',
    [result.insertId]
  );

  return newRows[0] as GameCategory;
};

// 메커니즘 조회 또는 생성
export const findOrCreateMechanism = async (
  bggMechanismId: number,
  nameEn: string
): Promise<GameMechanism> => {
  // 기존 메커니즘 조회
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM gameMechanisms WHERE bggMechanismId = ?',
    [bggMechanismId]
  );

  if (rows.length > 0) {
    return rows[0] as GameMechanism;
  }

  // 새 메커니즘 생성
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO gameMechanisms (bggMechanismId, nameEn) VALUES (?, ?)',
    [bggMechanismId, nameEn]
  );

  const [newRows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM gameMechanisms WHERE id = ?',
    [result.insertId]
  );

  return newRows[0] as GameMechanism;
};

// 게임-카테고리 매핑 생성
export const createGameCategoryMapping = async (
  gameId: number,
  categoryId: number
): Promise<void> => {
  await pool.execute(
    'INSERT IGNORE INTO gameCategoryMappings (gameId, categoryId) VALUES (?, ?)',
    [gameId, categoryId]
  );
};

// 게임-메커니즘 매핑 생성
export const createGameMechanismMapping = async (
  gameId: number,
  mechanismId: number
): Promise<void> => {
  await pool.execute(
    'INSERT IGNORE INTO gameMechanismMappings (gameId, mechanismId) VALUES (?, ?)',
    [gameId, mechanismId]
  );
};

// 게임의 카테고리 조회
export const findCategoriesByGameId = async (gameId: number): Promise<GameCategory[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT c.* FROM gameCategories c
     INNER JOIN gameCategoryMappings m ON c.id = m.categoryId
     WHERE m.gameId = ?`,
    [gameId]
  );
  return rows as GameCategory[];
};

// 게임의 메커니즘 조회
export const findMechanismsByGameId = async (gameId: number): Promise<GameMechanism[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT m.* FROM gameMechanisms m
     INNER JOIN gameMechanismMappings mm ON m.id = mm.mechanismId
     WHERE mm.gameId = ?`,
    [gameId]
  );
  return rows as GameMechanism[];
};

// 게임의 기존 카테고리 매핑 삭제
export const deleteCategoryMappingsByGameId = async (gameId: number): Promise<void> => {
  await pool.execute('DELETE FROM gameCategoryMappings WHERE gameId = ?', [gameId]);
};

// 게임의 기존 메커니즘 매핑 삭제
export const deleteMechanismMappingsByGameId = async (gameId: number): Promise<void> => {
  await pool.execute('DELETE FROM gameMechanismMappings WHERE gameId = ?', [gameId]);
};

