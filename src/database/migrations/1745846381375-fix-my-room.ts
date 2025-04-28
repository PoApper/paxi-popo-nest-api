/* eslint-disable import/named */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMyRoom1745846381375 implements MigrationInterface {
  name = 'FixMyRoom1745846381375';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`report\` (\`id\` int NOT NULL AUTO_INCREMENT, \`reporterUuid\` varchar(255) NOT NULL, \`targetUserUuid\` varchar(255) NULL, \`targetRoomUuid\` varchar(255) NULL, \`reason\` text NULL, \`status\` varchar(255) NOT NULL DEFAULT 'PENDING', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`nickname\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userUuid\` varchar(255) NOT NULL, \`nickname\` varchar(20) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_30b488b4298d857c45e04e6ec5\` (\`userUuid\`), UNIQUE INDEX \`REL_30b488b4298d857c45e04e6ec5\` (\`userUuid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` ADD \`accountHolderName\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`account\` ADD \`bankName\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_user\` CHANGE \`kickedReason\` \`kickedReason\` varchar(255) NULL`,
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
      `CREATE UNIQUE INDEX \`IDX_838c93e50d7e0d3096d7e294f2\` ON \`account\` (\`userUuid\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_f8927af7d25e4cf999734949064\` FOREIGN KEY (\`senderUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` ADD CONSTRAINT \`FK_627bda9d278fc8d5564d52f9911\` FOREIGN KEY (\`reporterUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` ADD CONSTRAINT \`FK_aa0b0a7cd71c644c5fc0d6edac9\` FOREIGN KEY (\`targetUserUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` ADD CONSTRAINT \`FK_4caf753c1bcaa60ba204cff5747\` FOREIGN KEY (\`targetRoomUuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` ADD CONSTRAINT \`FK_02cca8cb2252024d581f702f93a\` FOREIGN KEY (\`payerUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`nickname\` ADD CONSTRAINT \`FK_30b488b4298d857c45e04e6ec52\` FOREIGN KEY (\`userUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`nickname\` DROP FOREIGN KEY \`FK_30b488b4298d857c45e04e6ec52\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_02cca8cb2252024d581f702f93a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_4caf753c1bcaa60ba204cff5747\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_aa0b0a7cd71c644c5fc0d6edac9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_627bda9d278fc8d5564d52f9911\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_f8927af7d25e4cf999734949064\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_838c93e50d7e0d3096d7e294f2\` ON \`account\``,
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
      `ALTER TABLE \`room_user\` CHANGE \`kickedReason\` \`kickedReason\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(`ALTER TABLE \`account\` DROP COLUMN \`bankName\``);
    await queryRunner.query(
      `ALTER TABLE \`account\` DROP COLUMN \`accountHolderName\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_30b488b4298d857c45e04e6ec5\` ON \`nickname\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_30b488b4298d857c45e04e6ec5\` ON \`nickname\``,
    );
    await queryRunner.query(`DROP TABLE \`nickname\``);
    await queryRunner.query(`DROP TABLE \`report\``);
  }
}
