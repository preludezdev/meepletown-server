import pool from '../config/database';
import { ListingImage, CreateListingImageRequest } from '../models/ListingImage';
import { RowDataPacket } from 'mysql2';

// ListingId로 이미지 조회 (순서대로)
export const findImagesByListingId = async (
  listingId: number
): Promise<ListingImage[]> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM listingImages WHERE listingId = ? ORDER BY orderIndex ASC',
    [listingId]
  );
  return rows as ListingImage[];
};

// 이미지 생성
export const createListingImage = async (
  listingId: number,
  imageData: CreateListingImageRequest
): Promise<ListingImage> => {
  const { url, orderIndex } = imageData;

  const [result] = await pool.execute(
    'INSERT INTO listingImages (listingId, url, orderIndex) VALUES (?, ?, ?)',
    [listingId, url, orderIndex]
  );

  const insertId = (result as any).insertId;
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM listingImages WHERE id = ?',
    [insertId]
  );

  if (!rows[0]) {
    throw new Error('이미지 생성 후 조회 실패');
  }
  return rows[0] as ListingImage;
};

// Listing의 모든 이미지 삭제
export const deleteImagesByListingId = async (
  listingId: number
): Promise<boolean> => {
  const [result] = await pool.execute(
    'DELETE FROM listingImages WHERE listingId = ?',
    [listingId]
  );
  return (result as any).affectedRows > 0;
};

// 이미지 삭제
export const deleteListingImage = async (id: number): Promise<boolean> => {
  const [result] = await pool.execute('DELETE FROM listingImages WHERE id = ?', [
    id,
  ]);
  return (result as any).affectedRows > 0;
};

