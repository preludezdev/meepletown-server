import { env } from '../config/env';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationResult {
  success: boolean;
  skipped?: boolean; // non-production에서 전송 차단된 경우
  messageId?: string;
  error?: string;
}

/**
 * FCM을 통해 단일 유저에게 푸시 알림을 전송한다.
 *
 * - production: 실제 FCM 전송 (FCM_* 환경변수 필요)
 * - staging/development: 콘솔 출력만 하고 실제 전송하지 않음
 */
export const sendPushNotification = async (
  payload: NotificationPayload
): Promise<NotificationResult> => {
  if (!env.isProduction) {
    console.log(`[${env.appEnv.toUpperCase()}] 알림 전송 차단 - 실제 발송 없음`, {
      userId: payload.userId,
      title: `[${env.appEnv.toUpperCase()}] ${payload.title}`,
      body: payload.body,
    });
    return { success: true, skipped: true };
  }

  if (!env.notification) {
    console.error('[NOTIFICATION] FCM 환경변수가 설정되지 않았습니다 (FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY)');
    return { success: false, error: 'FCM 설정 누락' };
  }

  // TODO: FCM SDK 연동 시 아래 구현
  // const { GoogleAuth } = require('google-auth-library');
  // const auth = new GoogleAuth({ ... });
  // ...
  console.warn('[NOTIFICATION] FCM 전송 로직이 아직 구현되지 않았습니다.');
  return { success: false, error: '미구현' };
};

/**
 * 여러 유저에게 동시에 푸시 알림을 전송한다.
 * production 환경에서만 허용되며, staging에서 호출 시 에러를 던진다.
 */
export const sendBulkPushNotification = async (
  userIds: string[],
  payload: Omit<NotificationPayload, 'userId'>
): Promise<{ sent: number; failed: number }> => {
  if (!env.isProduction) {
    throw new Error(
      `[${env.appEnv.toUpperCase()}] 대량 알림 발송은 production 환경에서만 허용됩니다.`
    );
  }

  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushNotification({ ...payload, userId }))
  );

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;
  const failed = results.length - sent;

  return { sent, failed };
};
