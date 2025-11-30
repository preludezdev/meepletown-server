// ListingImage 모델 타입 정의

export interface ListingImage {
  id: number;
  listingId: number;
  url: string;
  orderIndex: number;
  createdAt: Date;
}

// 이미지 업로드 요청 타입
export interface CreateListingImageRequest {
  url: string;
  orderIndex: number;
}

