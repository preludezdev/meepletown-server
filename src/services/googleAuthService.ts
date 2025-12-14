import axios from 'axios';
import { findOrCreateUserBySocial } from '../repositories/userRepository';
import { SocialLoginRequest, UserResponse } from '../models/User';
import { generateToken } from './authService';

// 구글 사용자 정보 조회
export const getGoogleUserInfo = async (
  accessToken: string
): Promise<{ id: string; nickname: string; profileImage?: string }> => {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const googleUser = response.data;
    return {
      id: googleUser.id,
      nickname: googleUser.name || '사용자',
      profileImage: googleUser.picture,
    };
  } catch (error) {
    throw new Error('구글 사용자 정보 조회 실패');
  }
};

// 구글 로그인 처리
export const googleLogin = async (
  accessToken: string
): Promise<{ user: UserResponse; token: string }> => {
  // 구글에서 사용자 정보 가져오기
  const googleUserInfo = await getGoogleUserInfo(accessToken);

  // DB에 사용자 저장 또는 조회
  const socialData: SocialLoginRequest = {
    socialId: googleUserInfo.id,
    socialType: 'google',
    nickname: googleUserInfo.nickname,
    avatar: googleUserInfo.profileImage,
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

