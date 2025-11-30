import pool from '../config/database';
import {
  Listing,
  CreateListingRequest,
  UpdateListingRequest,
  ListingFilter,
  ListingSort,
} from '../models/Listing';
import { RowDataPacket } from 'mysql2';

// 모든 Listing 조회 (필터, 정렬, 페이지네이션)
export const findAllListings = async (
  filter?: ListingFilter,
  sort: ListingSort = 'latest',
  page: number = 1,
  pageSize: number = 20
): Promise<{ listings: Listing[]; total: number }> => {
  const offset = (page - 1) * pageSize;
  let whereClause = 'WHERE isHidden = FALSE';
  const params: any[] = [];

  // 필터 적용
  if (filter?.gameName) {
    whereClause += ' AND gameName LIKE ?';
    params.push(`%${filter.gameName}%`);
  }
  if (filter?.method) {
    whereClause += ' AND method = ?';
    params.push(filter.method);
  }

  // 정렬
  let orderClause = 'ORDER BY createdAt DESC'; // 최신순
  if (sort === 'latest') {
    orderClause = 'ORDER BY createdAt DESC';
  }

  // 전체 개수 조회
  const [countResult] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM listings ${whereClause}`,
    params
  );
  const total = (countResult[0] as { total: number }).total || 0;

  // Listing 목록 조회 (LIMIT/OFFSET은 숫자로 직접 전달)
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM listings ${whereClause} ${orderClause} LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );

  return { listings: rows as Listing[], total };
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
  listingData: CreateListingRequest
): Promise<Listing> => {
  const {
    gameName,
    title,
    price,
    method,
    region,
    description,
    contactLink,
  } = listingData;

  const [result] = await pool.execute(
    `INSERT INTO listings (userId, gameName, title, price, method, region, description, contactLink)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
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
  listingData: UpdateListingRequest
): Promise<Listing | null> => {
  const fields: string[] = [];
  const values: any[] = [];

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
