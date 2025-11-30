import axios from 'axios';
import { findOrCreateUserBySocial } from '../repositories/userRepository';
import { SocialLoginRequest, UserResponse } from '../models/User';
import { generateToken } from './authService';

// 카카오 사용자 정보 조회
export const getKakaoUserInfo = async (
  accessToken: string
): Promise<{ id: string; nickname: string; profileImage?: string }> => {
  try {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = response.data;
    return {
      id: kakaoUser.id.toString(),
      nickname: kakaoUser.kakao_account?.profile?.nickname || '사용자',
      profileImage: kakaoUser.kakao_account?.profile?.profile_image_url,
    };
  } catch (error) {
    throw new Error('카카오 사용자 정보 조회 실패');
  }
};

// 카카오 로그인 처리
export const kakaoLogin = async (
  accessToken: string
): Promise<{ user: UserResponse; token: string }> => {
  // 카카오에서 사용자 정보 가져오기
  const kakaoUserInfo = await getKakaoUserInfo(accessToken);

  // DB에 사용자 저장 또는 조회
  const socialData: SocialLoginRequest = {
    socialId: kakaoUserInfo.id,
    socialType: 'kakao',
    nickname: kakaoUserInfo.nickname,
    avatar: kakaoUserInfo.profileImage,
  };

  const user = await findOrCreateUserBySocial(socialData);

  // JWT 토큰 생성
  const token = generateToken(user.id, user.nickname);

  // 응답용 User 객체
  const userResponse: UserResponse = {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  return { user: userResponse, token };
};

