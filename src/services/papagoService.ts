import axios from 'axios';
import { env } from '../config/env';

// 지원 언어 코드
type LanguageCode = 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW' | 'es' | 'fr' | 'de' | 'ru';

interface TranslationResult {
  translatedText: string;
  detectedSourceLang?: string;
  characterCount: number;
}

// Papago API 클라이언트
const papagoClient = axios.create({
  baseURL: 'https://naveropenapi.apigw.ntruss.com',
  timeout: 30000, // 30초 타임아웃
});

// 텍스트 번역 (기본 함수)
export const translateText = async (
  text: string,
  sourceLang: LanguageCode = 'en',
  targetLang: LanguageCode = 'ko'
): Promise<TranslationResult> => {
  if (!env.papago) {
    throw new Error('Papago API 키가 설정되지 않았습니다 (.env에 PAPAGO_CLIENT_ID, PAPAGO_CLIENT_SECRET 필요)');
  }

  if (!text || text.trim().length === 0) {
    return {
      translatedText: '',
      characterCount: 0,
    };
  }

  // 5,000자 제한 체크
  if (text.length > 5000) {
    throw new Error('번역할 텍스트가 5,000자를 초과합니다. 분할 번역을 사용하세요.');
  }

  try {
    const response = await papagoClient.post(
      '/nmt/v1/translation',
      {
        source: sourceLang,
        target: targetLang,
        text: text,
      },
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': env.papago.clientId,
          'X-NCP-APIGW-API-KEY': env.papago.clientSecret,
          'Content-Type': 'application/json',
        },
      }
    );

    const translatedText = response.data.message.result.translatedText;
    const detectedSourceLang = response.data.message.result.srcLangType;

    return {
      translatedText,
      detectedSourceLang,
      characterCount: text.length,
    };
  } catch (error: any) {
    if (error.response?.status === 429) {
      throw new Error('Papago API 요청 한도를 초과했습니다');
    }
    if (error.response?.status === 400) {
      throw new Error('잘못된 번역 요청입니다');
    }
    console.error('Papago 번역 에러:', error.message);
    throw new Error(`번역 실패: ${error.message}`);
  }
};

// 긴 텍스트 분할 번역 (5,000자 초과 시)
export const translateLongText = async (
  text: string,
  sourceLang: LanguageCode = 'en',
  targetLang: LanguageCode = 'ko'
): Promise<TranslationResult> => {
  if (text.length <= 5000) {
    return await translateText(text, sourceLang, targetLang);
  }

  // 문단 단위로 분할 (이중 줄바꿈 기준)
  const paragraphs = text.split('\n\n').filter((p) => p.trim().length > 0);
  const translatedParagraphs: string[] = [];
  let totalCharacters = 0;

  let currentBatch = '';
  
  for (const paragraph of paragraphs) {
    // 현재 배치에 추가했을 때 5,000자 초과하면 먼저 번역
    if (currentBatch.length + paragraph.length + 2 > 5000) {
      if (currentBatch.length > 0) {
        const result = await translateText(currentBatch, sourceLang, targetLang);
        translatedParagraphs.push(result.translatedText);
        totalCharacters += result.characterCount;
        currentBatch = '';
        
        // Rate limit 방지 (0.5초 대기)
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      
      // 현재 문단이 5,000자를 초과하는 경우
      if (paragraph.length > 5000) {
        // 문장 단위로 분할 (마침표 기준)
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        let sentenceBatch = '';
        
        for (const sentence of sentences) {
          if (sentenceBatch.length + sentence.length > 5000) {
            if (sentenceBatch.length > 0) {
              const result = await translateText(sentenceBatch, sourceLang, targetLang);
              translatedParagraphs.push(result.translatedText);
              totalCharacters += result.characterCount;
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
            sentenceBatch = sentence;
          } else {
            sentenceBatch += sentence;
          }
        }
        
        if (sentenceBatch.length > 0) {
          const result = await translateText(sentenceBatch, sourceLang, targetLang);
          translatedParagraphs.push(result.translatedText);
          totalCharacters += result.characterCount;
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } else {
        currentBatch = paragraph;
      }
    } else {
      currentBatch += (currentBatch.length > 0 ? '\n\n' : '') + paragraph;
    }
  }

  // 남은 배치 번역
  if (currentBatch.length > 0) {
    const result = await translateText(currentBatch, sourceLang, targetLang);
    translatedParagraphs.push(result.translatedText);
    totalCharacters += result.characterCount;
  }

  return {
    translatedText: translatedParagraphs.join('\n\n'),
    characterCount: totalCharacters,
  };
};

// 게임 제목 번역 (짧은 텍스트)
export const translateGameName = async (nameEn: string): Promise<string> => {
  if (!nameEn || nameEn.trim().length === 0) {
    return '';
  }

  try {
    const result = await translateText(nameEn, 'en', 'ko');
    return result.translatedText;
  } catch (error) {
    console.error(`게임 제목 번역 실패 (${nameEn}):`, error);
    return ''; // 실패 시 빈 문자열 반환
  }
};

// 게임 설명 번역 (긴 텍스트, 분할 번역 지원)
export const translateGameDescription = async (description: string): Promise<TranslationResult> => {
  if (!description || description.trim().length === 0) {
    return {
      translatedText: '',
      characterCount: 0,
    };
  }

  try {
    return await translateLongText(description, 'en', 'ko');
  } catch (error) {
    console.error('게임 설명 번역 실패:', error);
    throw error;
  }
};

// 카테고리/메커니즘 이름 번역 (짧은 텍스트 일괄)
export const translateTerms = async (terms: string[]): Promise<Map<string, string>> => {
  const translations = new Map<string, string>();

  if (!terms || terms.length === 0) {
    return translations;
  }

  // 여러 용어를 줄바꿈으로 구분해서 한 번에 번역
  const combinedText = terms.join('\n');

  try {
    const result = await translateText(combinedText, 'en', 'ko');
    const translatedTerms = result.translatedText.split('\n');

    terms.forEach((term, index) => {
      if (translatedTerms[index]) {
        translations.set(term, translatedTerms[index]);
      }
    });

    return translations;
  } catch (error) {
    console.error('용어 번역 실패:', error);
    return translations;
  }
};

// 번역 가능 여부 확인
export const isPapagoAvailable = (): boolean => {
  return !!env.papago;
};
