import { MigrationInterface, QueryRunner } from "typeorm";

export class PaxiChatDeletedAndReport09131757772297979 implements MigrationInterface {
    name = 'PaxiChatDeletedAndReport09131757772297979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`room_user\` DROP FOREIGN KEY \`FK_2956a9a5026948a7c34f63251f0\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` DROP FOREIGN KEY \`FK_417259ab9f78d558cbd660fd800\``);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_01d4b5d803a2b6c4fb397f1d73c\``);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_f8927af7d25e4cf999734949064\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_4caf753c1bcaa60ba204cff5747\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_627bda9d278fc8d5564d52f9911\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_aa0b0a7cd71c644c5fc0d6edac9\``);
        await queryRunner.query(`ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_02cca8cb2252024d581f702f93a\``);
        await queryRunner.query(`ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_ae4aa4cd708794a85d6ed8463ec\``);
        await queryRunner.query(`ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_838c93e50d7e0d3096d7e294f22\``);
        await queryRunner.query(`DROP INDEX \`IDX_838c93e50d7e0d3096d7e294f2\` ON \`account\``);
        await queryRunner.query(`DROP INDEX \`REL_838c93e50d7e0d3096d7e294f2\` ON \`account\``);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD \`is_deleted\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD \`resolution_message\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD \`resolver_uuid\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD \`resolver_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD \`resolved_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`account\` ADD UNIQUE INDEX \`IDX_7c98874de3bb6d0b596e2ef68d\` (\`user_uuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_7c98874de3bb6d0b596e2ef68d\` ON \`account\` (\`user_uuid\`)`);
        await queryRunner.query(`ALTER TABLE \`room_user\` ADD CONSTRAINT \`FK_871dd34f4b4832dd191309476b1\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room_user\` ADD CONSTRAINT \`FK_7c96faab1235d6d892054571245\` FOREIGN KEY (\`room_uuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_dade2fa80b0ed2a99f24f5d2ac6\` FOREIGN KEY (\`room_uuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_969e9f034be027b910c247c07c6\` FOREIGN KEY (\`sender_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_6ef2385e62ad33dcad27118f785\` FOREIGN KEY (\`reporter_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_cc0502245760f3d54513fb3aa20\` FOREIGN KEY (\`target_user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_52aab1527667564d3c2f9a02c52\` FOREIGN KEY (\`target_room_uuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room\` ADD CONSTRAINT \`FK_8cd278ba000aa086fac39f1118b\` FOREIGN KEY (\`owner_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room\` ADD CONSTRAINT \`FK_268ece8bf55ae5d9edb2ce2311c\` FOREIGN KEY (\`payer_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`account\` ADD CONSTRAINT \`FK_7c98874de3bb6d0b596e2ef68da\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`account\` DROP FOREIGN KEY \`FK_7c98874de3bb6d0b596e2ef68da\``);
        await queryRunner.query(`ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_268ece8bf55ae5d9edb2ce2311c\``);
        await queryRunner.query(`ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_8cd278ba000aa086fac39f1118b\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_52aab1527667564d3c2f9a02c52\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_cc0502245760f3d54513fb3aa20\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_6ef2385e62ad33dcad27118f785\``);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_969e9f034be027b910c247c07c6\``);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_dade2fa80b0ed2a99f24f5d2ac6\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` DROP FOREIGN KEY \`FK_7c96faab1235d6d892054571245\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` DROP FOREIGN KEY \`FK_871dd34f4b4832dd191309476b1\``);
        await queryRunner.query(`DROP INDEX \`REL_7c98874de3bb6d0b596e2ef68d\` ON \`account\``);
        await queryRunner.query(`ALTER TABLE \`account\` DROP INDEX \`IDX_7c98874de3bb6d0b596e2ef68d\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP COLUMN \`resolved_at\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP COLUMN \`resolver_name\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP COLUMN \`resolver_uuid\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP COLUMN \`resolution_message\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`is_deleted\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_838c93e50d7e0d3096d7e294f2\` ON \`account\` (\`user_uuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_838c93e50d7e0d3096d7e294f2\` ON \`account\` (\`user_uuid\`)`);
        await queryRunner.query(`ALTER TABLE \`account\` ADD CONSTRAINT \`FK_838c93e50d7e0d3096d7e294f22\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room\` ADD CONSTRAINT \`FK_ae4aa4cd708794a85d6ed8463ec\` FOREIGN KEY (\`owner_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room\` ADD CONSTRAINT \`FK_02cca8cb2252024d581f702f93a\` FOREIGN KEY (\`payer_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_aa0b0a7cd71c644c5fc0d6edac9\` FOREIGN KEY (\`target_user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_627bda9d278fc8d5564d52f9911\` FOREIGN KEY (\`reporter_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_4caf753c1bcaa60ba204cff5747\` FOREIGN KEY (\`target_room_uuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_f8927af7d25e4cf999734949064\` FOREIGN KEY (\`sender_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_01d4b5d803a2b6c4fb397f1d73c\` FOREIGN KEY (\`room_uuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room_user\` ADD CONSTRAINT \`FK_417259ab9f78d558cbd660fd800\` FOREIGN KEY (\`room_uuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room_user\` ADD CONSTRAINT \`FK_2956a9a5026948a7c34f63251f0\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
