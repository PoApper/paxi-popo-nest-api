import { MigrationInterface, QueryRunner } from 'typeorm';

export class Regular523LastReadMessage1747966071397
  implements MigrationInterface
{
  name = 'Regular523LastReadMessage1747966071397';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`room_user\` ADD \`lastReadChatUuid\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat\` ADD \`senderNickname\` varchar(255) NULL`,
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
      `ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_aa0b0a7cd71c644c5fc0d6edac9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_4caf753c1bcaa60ba204cff5747\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` CHANGE \`targetUserUuid\` \`targetUserUuid\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` CHANGE \`targetRoomUuid\` \`targetRoomUuid\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` CHANGE \`reason\` \`reason\` text NULL`,
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
      `ALTER TABLE \`report\` ADD CONSTRAINT \`FK_aa0b0a7cd71c644c5fc0d6edac9\` FOREIGN KEY (\`targetUserUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` ADD CONSTRAINT \`FK_4caf753c1bcaa60ba204cff5747\` FOREIGN KEY (\`targetRoomUuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
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
      `ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_4caf753c1bcaa60ba204cff5747\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_aa0b0a7cd71c644c5fc0d6edac9\``,
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
      `ALTER TABLE \`report\` CHANGE \`reason\` \`reason\` text NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` CHANGE \`targetRoomUuid\` \`targetRoomUuid\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` CHANGE \`targetUserUuid\` \`targetUserUuid\` varchar(255) NULL DEFAULT 'NULL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` ADD CONSTRAINT \`FK_4caf753c1bcaa60ba204cff5747\` FOREIGN KEY (\`targetRoomUuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`report\` ADD CONSTRAINT \`FK_aa0b0a7cd71c644c5fc0d6edac9\` FOREIGN KEY (\`targetUserUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
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
    await queryRunner.query(
      `ALTER TABLE \`chat\` DROP COLUMN \`senderNickname\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_user\` DROP COLUMN \`lastReadChatUuid\``,
    );
  }
}
