export default () => {
  const isTest = process.env.NODE_ENV === 'test';

  return {
    database: {
      type: isTest ? 'sqlite' : process.env.DATABASE_TYPE || 'mysql',
      host: isTest ? undefined : process.env.DATABASE_HOST,
      port: isTest
        ? undefined
        : parseInt(process.env.DATABASE_PORT || '3306', 10),
      username: isTest ? undefined : process.env.DATABASE_USERNAME,
      password: isTest ? undefined : process.env.DATABASE_PASSWORD,
      database: isTest ? ':memory:' : process.env.DATABASE_DATABASE,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: isTest ? true : process.env.DATABASE_SYNC === 'true', // 테스트 환경에서는 항상 true
      dropSchema: isTest, // ✅ 테스트 시 DB 초기화
    },
  };
};
