import { MigrationInterface, QueryRunner } from "typeorm";

export class PaxiReportResolver8271756267480440 implements MigrationInterface {
    name = 'PaxiReportResolver8271756267480440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 마이그레이션 시 기존에 반영하지 못했던 FK, Unique 제약 조건 때문에
        // report 관련 필드 네 개는 추가된 채로 롤백 안돼서 아래와 같은 스크립트만 나옴
        // report.resolutionMessage
        // report.resolverUuid
        // report.resolverName
        // report.resolvedAt
        await queryRunner.query(`ALTER TABLE \`fcm_key\` ADD UNIQUE INDEX \`IDX_0a5b7966f6ab9aaae768ce4636\` (\`push_key\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`fcm_key\` DROP INDEX \`IDX_0a5b7966f6ab9aaae768ce4636\``);
    }

}
