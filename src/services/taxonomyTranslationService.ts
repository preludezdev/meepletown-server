import * as gameRepository from '../repositories/gameRepository';
import * as papagoService from './papagoService';
import { GameCategory, GameMechanism } from '../models/Game';

const BATCH_SIZE = 50; // 한 번에 번역할 최대 용어 수

// 카테고리 전체 번역 (nameKo가 없는 것만)
export const translateAllCategories = async (): Promise<{
  translated: number;
  failed: number;
  skipped: number;
  details: Array<{ id: number; nameEn: string; nameKo?: string; status: string }>;
}> => {
  const untranslated = await gameRepository.findUntranslatedCategories();

  if (untranslated.length === 0) {
    console.log('[카테고리 번역] 번역할 카테고리가 없습니다');
    return { translated: 0, failed: 0, skipped: 0, details: [] };
  }

  console.log(`[카테고리 번역] 시작: ${untranslated.length}개`);
  return await _translateTermsBatch(untranslated, 'category');
};

// 메커니즘 전체 번역 (nameKo가 없는 것만)
export const translateAllMechanisms = async (): Promise<{
  translated: number;
  failed: number;
  skipped: number;
  details: Array<{ id: number; nameEn: string; nameKo?: string; status: string }>;
}> => {
  const untranslated = await gameRepository.findUntranslatedMechanisms();

  if (untranslated.length === 0) {
    console.log('[메커니즘 번역] 번역할 메커니즘이 없습니다');
    return { translated: 0, failed: 0, skipped: 0, details: [] };
  }

  console.log(`[메커니즘 번역] 시작: ${untranslated.length}개`);
  return await _translateTermsBatch(untranslated, 'mechanism');
};

// 카테고리 목록 조회 (전체, nameKo 포함)
export const getCategoriesStatus = async (): Promise<{
  total: number;
  translated: number;
  untranslated: number;
  categories: GameCategory[];
}> => {
  const categories = await gameRepository.findAllCategories();
  const translated = categories.filter((c) => !!c.nameKo).length;
  return {
    total: categories.length,
    translated,
    untranslated: categories.length - translated,
    categories,
  };
};

// 메커니즘 목록 조회 (전체, nameKo 포함)
export const getMechanismsStatus = async (): Promise<{
  total: number;
  translated: number;
  untranslated: number;
  mechanisms: GameMechanism[];
}> => {
  const mechanisms = await gameRepository.findAllMechanisms();
  const translated = mechanisms.filter((m) => !!m.nameKo).length;
  return {
    total: mechanisms.length,
    translated,
    untranslated: mechanisms.length - translated,
    mechanisms,
  };
};

// 공통 배치 번역 로직 (카테고리/메커니즘 공용)
const _translateTermsBatch = async (
  items: Array<{ id: number; nameEn: string }>,
  type: 'category' | 'mechanism'
): Promise<{
  translated: number;
  failed: number;
  skipped: number;
  details: Array<{ id: number; nameEn: string; nameKo?: string; status: string }>;
}> => {
  const result = { translated: 0, failed: 0, skipped: 0, details: [] as any[] };

  // BATCH_SIZE 단위로 나눠서 번역
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const nameEnList = batch.map((item) => item.nameEn);

    console.log(`[${type} 번역] 배치 ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length}개 번역 중`);

    try {
      const translations = await papagoService.translateTerms(nameEnList);

      for (const item of batch) {
        const nameKo = translations.get(item.nameEn);
        if (!nameKo) {
          console.warn(`[${type} 번역] 번역 결과 없음: ${item.nameEn}`);
          result.failed++;
          result.details.push({ id: item.id, nameEn: item.nameEn, status: 'failed' });
          continue;
        }

        try {
          if (type === 'category') {
            await gameRepository.updateCategoryNameKo(item.id, nameKo);
          } else {
            await gameRepository.updateMechanismNameKo(item.id, nameKo);
          }
          result.translated++;
          result.details.push({ id: item.id, nameEn: item.nameEn, nameKo, status: 'translated' });
          console.log(`[${type} 번역] 완료: "${item.nameEn}" → "${nameKo}"`);
        } catch (dbError: any) {
          console.error(`[${type} 번역] DB 저장 실패: ${item.nameEn}`, dbError.message);
          result.failed++;
          result.details.push({ id: item.id, nameEn: item.nameEn, status: 'db_failed' });
        }
      }
    } catch (apiError: any) {
      console.error(`[${type} 번역] Papago API 오류 (배치 ${Math.floor(i / BATCH_SIZE) + 1}):`, apiError.message);
      for (const item of batch) {
        result.failed++;
        result.details.push({ id: item.id, nameEn: item.nameEn, status: 'api_failed' });
      }
    }

    // 배치 간 rate limit 방지
    if (i + BATCH_SIZE < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`[${type} 번역] 완료: 번역=${result.translated}, 실패=${result.failed}`);
  return result;
};
