import {MigrationInterface, QueryRunner} from "typeorm";
import { Wall } from "../entities/Wall";
import { Hold } from "../entities/Hold";

export class AddStartAndEndHolds1563590510865 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const wallRepository = queryRunner.connection.getRepository(Wall);
        const firstWall = await wallRepository.findOne();
        if (!firstWall) {
            await queryRunner.query(`ALTER TABLE "problem" ADD "startHold1Id" integer NOT NULL`);
            await queryRunner.query(`ALTER TABLE "problem" ADD "endHold1Id" integer NOT NULL`);
        }
        else {
            const newHold = new Hold();
            newHold.data = '[]';
            newHold.wall = firstWall;
            await queryRunner.connection.getRepository(Hold).save(newHold);
            console.log(`Dummy hold id: ${newHold.id}`);
            if (newHold.id == null) {
                throw new Error(`Dummy hold id: ${newHold.id}`);
            }

            await queryRunner.query(`ALTER TABLE "problem" ADD "startHold1Id" integer`);
            await queryRunner.query(`UPDATE "problem" SET "startHold1Id" = ${newHold.id}`);
            await queryRunner.query(`ALTER TABLE "problem" ALTER COLUMN "startHold1Id" SET NOT NULL`);

            await queryRunner.query(`ALTER TABLE "problem" ADD "endHold1Id" integer`);
            await queryRunner.query(`UPDATE "problem" SET "endHold1Id" = ${newHold.id}`);
            await queryRunner.query(`ALTER TABLE "problem" ALTER COLUMN "endHold1Id" SET NOT NULL`);
        }

        await queryRunner.query(`ALTER TABLE "problem" ADD "startHold2Id" integer`);
        await queryRunner.query(`ALTER TABLE "problem" ADD "endHold2Id" integer`);
        await queryRunner.query(`ALTER TABLE "problem" ADD CONSTRAINT "FK_0a248ddd1d8b2103b0cf411bf42" FOREIGN KEY ("startHold1Id") REFERENCES "hold"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "problem" ADD CONSTRAINT "FK_f348bbac14945681813b4bf1ae1" FOREIGN KEY ("startHold2Id") REFERENCES "hold"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "problem" ADD CONSTRAINT "FK_892ce6eb3f760fd87ae552d9603" FOREIGN KEY ("endHold1Id") REFERENCES "hold"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "problem" ADD CONSTRAINT "FK_3a4ae126321f465164783d790a2" FOREIGN KEY ("endHold2Id") REFERENCES "hold"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "problem" DROP CONSTRAINT "FK_3a4ae126321f465164783d790a2"`);
        await queryRunner.query(`ALTER TABLE "problem" DROP CONSTRAINT "FK_892ce6eb3f760fd87ae552d9603"`);
        await queryRunner.query(`ALTER TABLE "problem" DROP CONSTRAINT "FK_f348bbac14945681813b4bf1ae1"`);
        await queryRunner.query(`ALTER TABLE "problem" DROP CONSTRAINT "FK_0a248ddd1d8b2103b0cf411bf42"`);
        await queryRunner.query(`ALTER TABLE "problem" DROP COLUMN "endHold2Id"`);
        await queryRunner.query(`ALTER TABLE "problem" DROP COLUMN "startHold2Id"`);
        await queryRunner.query(`ALTER TABLE "problem" DROP COLUMN "endHold1Id"`);
        await queryRunner.query(`ALTER TABLE "problem" DROP COLUMN "startHold1Id"`);
    }

}
