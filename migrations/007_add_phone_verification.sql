-- 번호인증 필드 추가 (Firebase Phone Auth 연동)
ALTER TABLE users
  ADD COLUMN phoneNumber VARCHAR(20) NULL COMMENT '인증된 전화번호 (E.164 형식)' AFTER socialType,
  ADD COLUMN phoneVerifiedAt TIMESTAMP NULL COMMENT '번호인증 완료 시각' AFTER phoneNumber,
  ADD INDEX idx_phoneNumber (phoneNumber);
