ALTER TABLE "persons" DROP CONSTRAINT "persons_manager_id_persons_user_id_fk";
--> statement-breakpoint
ALTER TABLE "persons" DROP COLUMN "manager_id";