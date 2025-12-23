export default () => {
  const isTest = process.env.NODE_ENV === 'test';
  const isProd = process.env.NODE_ENV === 'prod';

  // RSA 키 줄바꿈 처리
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
  const isEscaped = rawPrivateKey.includes('\\n');
  const privateKey = isEscaped
    ? rawPrivateKey.replace(/\\n/g, '\n')
    : rawPrivateKey;

  return {
    database: {
      type: isTest ? 'sqlite' : process.env.DATABASE_TYPE || 'mariadb',
      host: isTest ? undefined : process.env.DATABASE_HOST,
      port: isTest
        ? undefined
        : parseInt(process.env.DATABASE_PORT || '3306', 10),
      username: isTest ? undefined : process.env.DATABASE_USERNAME,
      password: isTest ? undefined : process.env.DATABASE_PASSWORD,
      database: isTest ? ':memory:' : process.env.DATABASE_DATABASE,
      entities: isTest
        ? ['src/**/*.entity{.ts,.js}']
        : ['dist/**/*.entity{.ts,.js}'],
      synchronize: isTest ? true : process.env.DATABASE_SYNC === 'true',
      dropSchema: isTest,
      charset: isTest ? undefined : 'utf8mb4',

      extra: isTest
        ? undefined
        : {
            // 커넥션 제한 안하면 터미널이나 로컬 개발 환경에서 too many connections 맞을 수 있음
            connectionLimit: isProd ? 10 : 5,
          },
    },

    // POPO의 FCM과 같은 설정 사용
    // Firebase 설정이 없어도 서버가 정상적으로 실행되도록 선택적으로 처리
    firebase: process.env.FIREBASE_PROJECT_ID
      ? {
          type: process.env.FIREBASE_TYPE,
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
          privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          clientId: process.env.FIREBASE_CLIENT_ID,
          authUri: process.env.FIREBASE_AUTH_URI,
          tokenUri: process.env.FIREBASE_TOKEN_URI,
          authProviderX509CertUrl:
            process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
          universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN,
        }
      : undefined,
  };
};
