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

function getEnvVarOrThrow(name: string): string {
  const value = process.env[name];
  if (typeof value === 'undefined' || value === '') {
    throw new Error(`Environment variable "${name}" is required but was not found or is empty.`);
  }
  return value;
}

loadEnvFile();

export const jwtConstants = {
  accessTokenSecret: getEnvVarOrThrow('JWT_ACCESS_TOKEN_SECRET'),
  refreshTokenSecret: getEnvVarOrThrow('JWT_REFRESH_TOKEN_SECRET'),
  accessTokenExpirationTime: getEnvVarOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
  refreshTokenExpirationTime: getEnvVarOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
};
