import { MigrationInterface, QueryRunner } from "typeorm";

export class PaxiChatIsDeleted981756900054217 implements MigrationInterface {
    name = 'PaxiChatIsDeleted981756900054217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chat\` ADD \`is_deleted\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`chat\` DROP COLUMN \`is_deleted\``);
    }

}
