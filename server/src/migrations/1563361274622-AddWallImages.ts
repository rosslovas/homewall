import {MigrationInterface, QueryRunner} from "typeorm";

export class AddWallImages1563361274622 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
		await queryRunner.query(`ALTER TABLE "wall" ADD "imageId" integer`);
		await queryRunner.query(`UPDATE "wall" SET "imageId" = 1`);
        await queryRunner.query(`ALTER TABLE "wall" ALTER COLUMN "imageId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wall" ADD CONSTRAINT "UQ_5a19aaa0f4ffcbf3a06cfc54a52" UNIQUE ("imageId")`);
        await queryRunner.query(`ALTER TABLE "wall" ADD CONSTRAINT "FK_5a19aaa0f4ffcbf3a06cfc54a52" FOREIGN KEY ("imageId") REFERENCES "image"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "wall" DROP CONSTRAINT "FK_5a19aaa0f4ffcbf3a06cfc54a52"`);
        await queryRunner.query(`ALTER TABLE "wall" DROP CONSTRAINT "UQ_5a19aaa0f4ffcbf3a06cfc54a52"`);
        await queryRunner.query(`ALTER TABLE "wall" DROP COLUMN "imageId"`);
    }

}
