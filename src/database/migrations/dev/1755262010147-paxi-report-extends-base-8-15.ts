import { MigrationInterface, QueryRunner } from "typeorm";

export class PaxiReportExtendsBase8151755262010147 implements MigrationInterface {
    name = 'PaxiReportExtendsBase8151755262010147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`report\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`room_user\` CHANGE \`kicked_reason\` \`kicked_reason\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`room_user\` CHANGE \`last_read_chat_uuid\` \`last_read_chat_uuid\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_969e9f034be027b910c247c07c6\``);
        await queryRunner.query(`ALTER TABLE \`chat\` CHANGE \`sender_nickname\` \`sender_nickname\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`chat\` CHANGE \`sender_uuid\` \`sender_uuid\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_cc0502245760f3d54513fb3aa20\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_52aab1527667564d3c2f9a02c52\``);
        await queryRunner.query(`ALTER TABLE \`report\` CHANGE \`target_user_uuid\` \`target_user_uuid\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`report\` CHANGE \`target_room_uuid\` \`target_room_uuid\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`report\` CHANGE \`reason\` \`reason\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_268ece8bf55ae5d9edb2ce2311c\``);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`payer_uuid\` \`payer_uuid\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`pay_amount\` \`pay_amount\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`payer_encrypted_account_number\` \`payer_encrypted_account_number\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`payer_account_holder_name\` \`payer_account_holder_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`payer_bank_name\` \`payer_bank_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`hashed_refresh_token\` \`hashed_refresh_token\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`refresh_token_expires_at\` \`refresh_token_expires_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_969e9f034be027b910c247c07c6\` FOREIGN KEY (\`sender_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_cc0502245760f3d54513fb3aa20\` FOREIGN KEY (\`target_user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_52aab1527667564d3c2f9a02c52\` FOREIGN KEY (\`target_room_uuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room\` ADD CONSTRAINT \`FK_268ece8bf55ae5d9edb2ce2311c\` FOREIGN KEY (\`payer_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`room\` DROP FOREIGN KEY \`FK_268ece8bf55ae5d9edb2ce2311c\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_52aab1527667564d3c2f9a02c52\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP FOREIGN KEY \`FK_cc0502245760f3d54513fb3aa20\``);
        await queryRunner.query(`ALTER TABLE \`chat\` DROP FOREIGN KEY \`FK_969e9f034be027b910c247c07c6\``);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`refresh_token_expires_at\` \`refresh_token_expires_at\` datetime NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`hashed_refresh_token\` \`hashed_refresh_token\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`payer_bank_name\` \`payer_bank_name\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`payer_account_holder_name\` \`payer_account_holder_name\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`payer_encrypted_account_number\` \`payer_encrypted_account_number\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`pay_amount\` \`pay_amount\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`payer_uuid\` \`payer_uuid\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`room\` ADD CONSTRAINT \`FK_268ece8bf55ae5d9edb2ce2311c\` FOREIGN KEY (\`payer_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` CHANGE \`reason\` \`reason\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`report\` CHANGE \`target_room_uuid\` \`target_room_uuid\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`report\` CHANGE \`target_user_uuid\` \`target_user_uuid\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_52aab1527667564d3c2f9a02c52\` FOREIGN KEY (\`target_room_uuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_cc0502245760f3d54513fb3aa20\` FOREIGN KEY (\`target_user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` CHANGE \`sender_uuid\` \`sender_uuid\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`chat\` CHANGE \`sender_nickname\` \`sender_nickname\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_969e9f034be027b910c247c07c6\` FOREIGN KEY (\`sender_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room_user\` CHANGE \`last_read_chat_uuid\` \`last_read_chat_uuid\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`room_user\` CHANGE \`kicked_reason\` \`kicked_reason\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`report\` DROP COLUMN \`created_at\``);
    }

}
