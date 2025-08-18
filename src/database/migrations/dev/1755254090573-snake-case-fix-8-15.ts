import { MigrationInterface, QueryRunner } from "typeorm";

export class SnakeCaseFix8151755252475296 implements MigrationInterface {
    name = 'SnakeCaseFix8151755252475296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`fcm_key\` DROP FOREIGN KEY \`FK_0a9a65f3c7649c91ca60aedf536\``);
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
        await queryRunner.query(`ALTER TABLE \`nickname\` DROP FOREIGN KEY \`FK_30b488b4298d857c45e04e6ec52\``);
        await queryRunner.query(`DROP INDEX \`IDX_6e9c98fcda8bae19d7939a59f4\` ON \`fcm_key\``);
        await queryRunner.query(`DROP INDEX \`REL_838c93e50d7e0d3096d7e294f2\` ON \`account\``);
        await queryRunner.query(`DROP INDEX \`IDX_838c93e50d7e0d3096d7e294f2\` ON \`account\``);
        await queryRunner.query(`DROP INDEX \`IDX_30b488b4298d857c45e04e6ec5\` ON \`nickname\``);
        await queryRunner.query(`DROP INDEX \`REL_30b488b4298d857c45e04e6ec5\` ON \`nickname\``);


        await queryRunner.query(`ALTER TABLE \`fcm_key\` RENAME COLUMN \`userUuid\` TO \`user_uuid\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` RENAME COLUMN \`pushKey\` TO \`push_key\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` RENAME COLUMN \`createdAt\` TO \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` RENAME COLUMN \`updatedAt\` TO \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` ADD UNIQUE INDEX \`IDX_0a5b7966f6ab9aaae768ce4636\` (\`push_key\`)`);


        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`userUuid\` TO \`user_uuid\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`roomUuid\` TO \`room_uuid\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`isPaid\` TO \`is_paid\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`kickedReason\` TO \`kicked_reason\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`createdAt\` TO \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`updatedAt\` TO \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`lastReadChatUuid\` TO \`last_read_chat_uuid\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`isMuted\` TO \`is_muted\``);

        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`roomUuid\` TO \`room_uuid\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`senderUuid\` TO \`sender_uuid\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`createdAt\` TO \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`messageType\` TO \`message_type\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`updatedAt\` TO \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`senderNickname\` TO \`sender_nickname\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`isEdited\` TO \`is_edited\``);

        await queryRunner.query(`ALTER TABLE \`report\` RENAME COLUMN \`reporterUuid\` TO \`reporter_uuid\``);
        await queryRunner.query(`ALTER TABLE \`report\` RENAME COLUMN \`targetUserUuid\` TO \`target_user_uuid\``);
        await queryRunner.query(`ALTER TABLE \`report\` RENAME COLUMN \`targetRoomUuid\` TO \`target_room_uuid\``);

        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`ownerUuid\` TO \`owner_uuid\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`departureLocation\` TO \`departure_location\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`destinationLocation\` TO \`destination_location\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`maxParticipant\` TO \`max_participant\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`currentParticipant\` TO \`current_participant\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`departureTime\` TO \`departure_time\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payerUuid\` TO \`payer_uuid\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payAmount\` TO \`pay_amount\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payerEncryptedAccountNumber\` TO \`payer_encrypted_account_number\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payerAccountHolderName\` TO \`payer_account_holder_name\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payerBankName\` TO \`payer_bank_name\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`departureAlertSent\` TO \`departure_alert_sent\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`createdAt\` TO \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`updatedAt\` TO \`updated_at\``);


        await queryRunner.query(`ALTER TABLE \`account\` RENAME COLUMN \`userUuid\` TO \`user_uuid\``);
        await queryRunner.query(`ALTER TABLE \`account\` ADD UNIQUE INDEX \`IDX_7c98874de3bb6d0b596e2ef68d\` (\`user_uuid\`)`);
        await queryRunner.query(`ALTER TABLE \`account\` RENAME COLUMN \`encryptedAccountNumber\` TO \`encrypted_account_number\``);
        await queryRunner.query(`ALTER TABLE \`account\` RENAME COLUMN \`accountHolderName\` TO \`account_holder_name\``);
        await queryRunner.query(`ALTER TABLE \`account\` RENAME COLUMN \`bankName\` TO \`bank_name\``);

        await queryRunner.query(`ALTER TABLE \`nickname\` RENAME COLUMN \`userUuid\` TO \`user_uuid\``);
        await queryRunner.query(`ALTER TABLE \`nickname\` ADD UNIQUE INDEX \`IDX_6406e4d246bfcc619942095254\` (\`user_uuid\`)`);
        await queryRunner.query(`ALTER TABLE \`nickname\` RENAME COLUMN \`createdAt\` TO \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`nickname\` RENAME COLUMN \`updatedAt\` TO \`updated_at\``);


        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`userType\` TO \`user_type\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`createdAt\` TO \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`lastLoginAt\` TO \`last_login_at\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`cryptoSalt\` TO \`crypto_salt\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`userStatus\` TO \`user_status\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`hashedRefreshToken\` TO \`hashed_refresh_token\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`refreshTokenExpiresAt\` TO \`refresh_token_expires_at\``);

        await queryRunner.query(`ALTER TABLE \`report\` CHANGE \`reason\` \`reason\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`account\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_7c98874de3bb6d0b596e2ef68d\` ON \`account\` (\`user_uuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_6406e4d246bfcc619942095254\` ON \`nickname\` (\`user_uuid\`)`);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` ADD CONSTRAINT \`FK_dea9472e4a513d65e387f225d6c\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
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
        await queryRunner.query(`ALTER TABLE \`nickname\` ADD CONSTRAINT \`FK_6406e4d246bfcc6199420952541\` FOREIGN KEY (\`user_uuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nickname\` DROP FOREIGN KEY \`FK_6406e4d246bfcc6199420952541\``);
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
        await queryRunner.query(`ALTER TABLE \`fcm_key\` DROP FOREIGN KEY \`FK_dea9472e4a513d65e387f225d6c\``);
        await queryRunner.query(`DROP INDEX \`REL_6406e4d246bfcc619942095254\` ON \`nickname\``);
        await queryRunner.query(`DROP INDEX \`REL_7c98874de3bb6d0b596e2ef68d\` ON \`account\``);
        await queryRunner.query(`ALTER TABLE \`account\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`room\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`report\` CHANGE \`reason\` \`reason\` text NULL DEFAULT 'NULL'`);


        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`user_type\` TO \`userType\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`created_at\` TO \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`last_login_at\` TO \`lastLoginAt\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`crypto_salt\` TO \`cryptoSalt\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`user_status\` TO \`userStatus\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`hashed_refresh_token\` TO \`hashedRefreshToken\``);
        await queryRunner.query(`ALTER TABLE \`user\` RENAME COLUMN \`refresh_token_expires_at\` TO \`refreshTokenExpiresAt\``);

        await queryRunner.query(`ALTER TABLE \`nickname\` DROP INDEX \`IDX_6406e4d246bfcc619942095254\``);
        await queryRunner.query(`ALTER TABLE \`nickname\` RENAME COLUMN \`user_uuid\` TO \`userUuid\``);
        await queryRunner.query(`ALTER TABLE \`nickname\` RENAME COLUMN \`created_at\` TO \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`nickname\` RENAME COLUMN \`updated_at\` TO \`updatedAt\``);

        await queryRunner.query(`ALTER TABLE \`account\` DROP INDEX \`IDX_7c98874de3bb6d0b596e2ef68d\``);
        await queryRunner.query(`ALTER TABLE \`account\` RENAME COLUMN \`user_uuid\` TO \`userUuid\``);
        await queryRunner.query(`ALTER TABLE \`account\` RENAME COLUMN \`encrypted_account_number\` TO \`encryptedAccountNumber\``);
        await queryRunner.query(`ALTER TABLE \`account\` RENAME COLUMN \`account_holder_name\` TO \`accountHolderName\``);
        await queryRunner.query(`ALTER TABLE \`account\` RENAME COLUMN \`bank_name\` TO \`bankName\``);

        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`owner_uuid\` TO \`ownerUuid\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`departure_location\` TO \`departureLocation\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`destination_location\` TO \`destinationLocation\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`max_participant\` TO \`maxParticipant\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`current_participant\` TO \`currentParticipant\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`departure_time\` TO \`departureTime\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payer_uuid\` TO \`payerUuid\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`pay_amount\` TO \`payAmount\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payer_encrypted_account_number\` TO \`payerEncryptedAccountNumber\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payer_account_holder_name\` TO \`payerAccountHolderName\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`payer_bank_name\` TO \`payerBankName\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`departure_alert_sent\` TO \`departureAlertSent\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`created_at\` TO \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`room\` RENAME COLUMN \`updated_at\` TO \`updatedAt\``);


        await queryRunner.query(`ALTER TABLE \`report\` RENAME COLUMN \`reporter_uuid\` TO \`reporterUuid\``);
        await queryRunner.query(`ALTER TABLE \`report\` RENAME COLUMN \`target_user_uuid\` TO \`targetUserUuid\``);
        await queryRunner.query(`ALTER TABLE \`report\` RENAME COLUMN \`target_room_uuid\` TO \`targetRoomUuid\``);

        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`room_uuid\` TO \`roomUuid\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`sender_uuid\` TO \`senderUuid\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`created_at\` TO \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`message_type\` TO \`messageType\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`updated_at\` TO \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`sender_nickname\` TO \`senderNickname\``);
        await queryRunner.query(`ALTER TABLE \`chat\` RENAME COLUMN \`is_edited\` TO \`isEdited\``);


        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`user_uuid\` TO \`userUuid\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`room_uuid\` TO \`roomUuid\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`is_paid\` TO \`isPaid\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`kicked_reason\` TO \`kickedReason\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`created_at\` TO \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`updated_at\` TO \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`last_read_chat_uuid\` TO \`lastReadChatUuid\``);
        await queryRunner.query(`ALTER TABLE \`room_user\` RENAME COLUMN \`is_muted\` TO \`isMuted\``);


        await queryRunner.query(`ALTER TABLE \`fcm_key\` DROP INDEX \`IDX_0a5b7966f6ab9aaae768ce4636\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` RENAME COLUMN \`user_uuid\` TO \`userUuid\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` RENAME COLUMN \`push_key\` TO \`pushKey\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` RENAME COLUMN \`created_at\` TO \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` RENAME COLUMN \`updated_at\` TO \`updatedAt\``);



        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_30b488b4298d857c45e04e6ec5\` ON \`nickname\` (\`userUuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_30b488b4298d857c45e04e6ec5\` ON \`nickname\` (\`userUuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_838c93e50d7e0d3096d7e294f2\` ON \`account\` (\`userUuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_838c93e50d7e0d3096d7e294f2\` ON \`account\` (\`userUuid\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_6e9c98fcda8bae19d7939a59f4\` ON \`fcm_key\` (\`pushKey\`)`);
        await queryRunner.query(`ALTER TABLE \`nickname\` ADD CONSTRAINT \`FK_30b488b4298d857c45e04e6ec52\` FOREIGN KEY (\`userUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`account\` ADD CONSTRAINT \`FK_838c93e50d7e0d3096d7e294f22\` FOREIGN KEY (\`userUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room\` ADD CONSTRAINT \`FK_ae4aa4cd708794a85d6ed8463ec\` FOREIGN KEY (\`ownerUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room\` ADD CONSTRAINT \`FK_02cca8cb2252024d581f702f93a\` FOREIGN KEY (\`payerUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_aa0b0a7cd71c644c5fc0d6edac9\` FOREIGN KEY (\`targetUserUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_627bda9d278fc8d5564d52f9911\` FOREIGN KEY (\`reporterUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report\` ADD CONSTRAINT \`FK_4caf753c1bcaa60ba204cff5747\` FOREIGN KEY (\`targetRoomUuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_f8927af7d25e4cf999734949064\` FOREIGN KEY (\`senderUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`chat\` ADD CONSTRAINT \`FK_01d4b5d803a2b6c4fb397f1d73c\` FOREIGN KEY (\`roomUuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room_user\` ADD CONSTRAINT \`FK_417259ab9f78d558cbd660fd800\` FOREIGN KEY (\`roomUuid\`) REFERENCES \`room\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`room_user\` ADD CONSTRAINT \`FK_2956a9a5026948a7c34f63251f0\` FOREIGN KEY (\`userUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fcm_key\` ADD CONSTRAINT \`FK_0a9a65f3c7649c91ca60aedf536\` FOREIGN KEY (\`userUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
