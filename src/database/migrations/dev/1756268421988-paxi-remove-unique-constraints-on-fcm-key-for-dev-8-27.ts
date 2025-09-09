import { MigrationInterface, QueryRunner } from "typeorm";

export class PaxiRemoveUniqueConstraintsOnFcmKeyForDev8271756268421988 implements MigrationInterface {
    name = 'PaxiRemoveUniqueConstraintsOnFcmKeyForDev8271756268421988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_0a5b7966f6ab9aaae768ce4636\` ON \`fcm_key\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_0a5b7966f6ab9aaae768ce4636\` ON \`fcm_key\` (\`push_key\`)`);
    }

}
