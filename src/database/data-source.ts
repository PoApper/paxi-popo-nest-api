import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql', // or 'postgres'
  host: 'poapper-database.clpejbrb3mzb.ap-northeast-2.rds.amazonaws.com', // ✅ RDS나 VPC 내부 DB 주소
  port: 3306,
  username: 'popo_dev',
  password: 'LPWsZGpgu6e*',
  database: 'popo_dev',
  synchronize: false, // ❗ 절대 true 금지 (prod에선)
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations', // migration 기록용 테이블
});

// NOTE: 마이그레이션 생성 명령어
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d src/database/data-source.ts src/database/migrations/이름
// NOTE: 마이그레이션 실행 명령어
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.ts
