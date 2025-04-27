/* eslint-disable import/named */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1745736613937 implements MigrationInterface {
  name = 'Init1745736613937';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`account\` (\`id\` int NOT NULL AUTO_INCREMENT, \`encryptedAccountNumber\` varchar(255) NOT NULL, \`userUuid\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`REL_838c93e50d7e0d3096d7e294f2\` (\`userUuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_user\` ADD \`kickedReason\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_f8927af7d25e4cf999734949064\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` CHANGE \`senderUuid\` \`senderUuid\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_02cca8cb2252024d581f702f93a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` CHANGE \`description\` \`description\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` CHANGE \`payerUuid\` \`payerUuid\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` CHANGE \`payAmount\` \`payAmount\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_f8927af7d25e4cf999734949064\` FOREIGN KEY (\`senderUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` ADD CONSTRAINT \`FK_02cca8cb2252024d581f702f93a\` FOREIGN KEY (\`payerUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` ADD CONSTRAINT \`FK_838c93e50d7e0d3096d7e294f22\` FOREIGN KEY (\`userUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_838c93e50d7e0d3096d7e294f22\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_02cca8cb2252024d581f702f93a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_f8927af7d25e4cf999734949064\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` CHANGE \`payAmount\` \`payAmount\` int NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` CHANGE \`payerUuid\` \`payerUuid\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` ADD CONSTRAINT \`FK_02cca8cb2252024d581f702f93a\` FOREIGN KEY (\`payerUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` CHANGE \`senderUuid\` \`senderUuid\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_f8927af7d25e4cf999734949064\` FOREIGN KEY (\`senderUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_user\` DROP COLUMN \`kickedReason\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_838c93e50d7e0d3096d7e294f2\` ON \`account\``,
    );
    await queryRunner.query(`DROP TABLE \`account\``);
  }
}
