/* eslint-disable import/named */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaseEntity1745826072919 implements MigrationInterface {
  name = 'BaseEntity1745826072919';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`fcm_key\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`fcm_key\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_user\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_user\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
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
      `ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_f8927af7d25e4cf999734949064\` FOREIGN KEY (\`senderUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room\` ADD CONSTRAINT \`FK_02cca8cb2252024d581f702f93a\` FOREIGN KEY (\`payerUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `ALTER TABLE \`room_user\` CHANGE \`kickedReason\` \`kickedReason\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(
      `ALTER TABLE \`room_user\` DROP COLUMN \`updatedAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_user\` DROP COLUMN \`createdAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`fcm_key\` DROP COLUMN \`updatedAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`fcm_key\` DROP COLUMN \`createdAt\``,
    );
  }
}
