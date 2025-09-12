import * as fs from 'fs';
import * as path from 'path';

// .env 파일을 직접 읽어서 환경변수 설정
function loadEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');

    envFile.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // 따옴표 제거
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    });
  } catch (error) {
    console.error('Failed to load .env file:', error);
  }
}

// 환경변수가 설정되어 있지 않으면 .env 파일에서 로드
if (!process.env.JWT_ACCESS_TOKEN_SECRET) {
  loadEnvFile();
}

export const jwtConstants = {
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET!,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET!,
  accessTokenExpirationTime: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME!,
  refreshTokenExpirationTime: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME!,
};
