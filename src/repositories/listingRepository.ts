import pool from '../config/database';
import {
  Listing,
  ListingListItem,
  CreateListingRequest,
  UpdateListingRequest,
  ListingFilter,
  ListingSort,
} from '../models/Listing';
import { RowDataPacket } from 'mysql2';

// 모든 Listing 조회 (필터, 정렬, 페이지네이션) - seller, thumbnailUrl 포함
export const findAllListings = async (
  filter?: ListingFilter,
  sort: ListingSort = 'latest',
  page: number = 1,
  pageSize: number = 20
): Promise<{ listings: ListingListItem[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  let whereClause = 'WHERE l.isHidden = FALSE';
  const params: any[] = [];

  // 필터 적용
  if (filter?.gameName) {
    whereClause += ' AND l.gameName LIKE ?';
    params.push(`%${filter.gameName}%`);
  }
  if (filter?.method) {
    whereClause += ' AND l.method = ?';
    params.push(filter.method);
  }

  // 정렬
  let orderClause = 'ORDER BY l.createdAt DESC';
  if (sort === 'latest') {
    orderClause = 'ORDER BY l.createdAt DESC';
  }

  // 전체 개수 조회 (JOIN 없이 동일 조건)
  const [countResult] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM listings l ${whereClause}`,
    params
  );
  const total = (countResult[0] as { total: number }).total || 0;

  // Listing 목록 조회: users JOIN (seller), 첫 번째 매물 이미지 또는 게임 이미지 (thumbnail)
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
      l.id, l.userId, l.gameId, l.gameName, l.title, l.price, l.method, l.region,
      l.description, l.contactLink, l.status, l.isHidden, l.createdAt, l.updatedAt,
      u.nickname AS sellerNickname, u.avatar AS sellerAvatar,
      COALESCE(
        (SELECT li.url FROM listingImages li WHERE li.listingId = l.id ORDER BY li.orderIndex ASC LIMIT 1),
        g.thumbnailUrl,
        g.imageUrl
      ) AS thumbnailUrl
    FROM listings l
    LEFT JOIN users u ON l.userId = u.id
    LEFT JOIN games g ON l.gameId = g.id
    ${whereClause} ${orderClause} LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );

  const listings: ListingListItem[] = (rows as any[]).map((row) => {
    const seller =
      row.sellerNickname != null
        ? { nickname: row.sellerNickname, avatar: row.sellerAvatar ?? null }
        : undefined;
    const { sellerNickname, sellerAvatar, ...listingFields } = row;
    return {
      ...listingFields,
      seller,
      thumbnailUrl: row.thumbnailUrl ?? null,
    } as ListingListItem;
  });

  return { listings, total };
};

// 오늘의 매물 조회 (오늘 생성된 것만, 숨김 제외)
export const findTodayListings = async (
  limit: number = 20
): Promise<Listing[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM listings 
     WHERE isHidden = FALSE 
     AND DATE(createdAt) = CURDATE()
     ORDER BY createdAt DESC 
     LIMIT ${limit}`
  );
  return rows as Listing[];
};

// ID로 Listing 조회
export const findListingById = async (id: number): Promise<Listing | null> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM listings WHERE id = ? AND isHidden = FALSE',
    [id]
  );
  return (rows[0] as Listing) || null;
};

// userId의 판매완료 건수 조회
export const getSoldCountByUserId = async (
  userId: number
): Promise<number> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as cnt FROM listings WHERE userId = ? AND status = ?',
    [userId, 'sold']
  );
  return (rows[0] as { cnt: number }).cnt || 0;
};

// UserId로 Listing 조회 (내 매물)
export const findListingsByUserId = async (
  userId: number
): Promise<Listing[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM listings WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  );
  return rows as Listing[];
};

// Listing 생성
export const createListing = async (
  userId: number,
  listingData: CreateListingRequest & { gameId?: number }
): Promise<Listing> => {
  const {
    gameId,
    gameName,
    title,
    price,
    method,
    region,
    description,
    contactLink,
  } = listingData;

  const [result] = await pool.execute(
    `INSERT INTO listings (userId, gameId, gameName, title, price, method, region, description, contactLink)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      gameId || null,
      gameName,
      title || null,
      price,
      method,
      region || null,
      description || null,
      contactLink || null,
    ]
  );

  const insertId = (result as any).insertId;
  const newListing = await findListingById(insertId);
  if (!newListing) {
    throw new Error('Listing 생성 후 조회 실패');
  }
  return newListing;
};

// Listing 업데이트
export const updateListing = async (
  id: number,
  listingData: UpdateListingRequest & { gameId?: number }
): Promise<Listing | null> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (listingData.gameId !== undefined) {
    fields.push('gameId = ?');
    values.push(listingData.gameId);
  }
  if (listingData.gameName !== undefined) {
    fields.push('gameName = ?');
    values.push(listingData.gameName);
  }
  if (listingData.title !== undefined) {
    fields.push('title = ?');
    values.push(listingData.title);
  }
  if (listingData.price !== undefined) {
    fields.push('price = ?');
    values.push(listingData.price);
  }
  if (listingData.method !== undefined) {
    fields.push('method = ?');
    values.push(listingData.method);
  }
  if (listingData.region !== undefined) {
    fields.push('region = ?');
    values.push(listingData.region);
  }
  if (listingData.description !== undefined) {
    fields.push('description = ?');
    values.push(listingData.description);
  }
  if (listingData.contactLink !== undefined) {
    fields.push('contactLink = ?');
    values.push(listingData.contactLink);
  }
  if (listingData.status !== undefined) {
    fields.push('status = ?');
    values.push(listingData.status);
  }

  if (fields.length === 0) {
    return findListingById(id);
  }

  values.push(id);
  await pool.execute(
    `UPDATE listings SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return findListingById(id);
};

// Listing 삭제
export const deleteListing = async (id: number): Promise<boolean> => {
  const [result] = await pool.execute('DELETE FROM listings WHERE id = ?', [
    id,
  ]);
  return (result as any).affectedRows > 0;
};
