CREATE TABLE "groups" (
	"group_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons_to_groups" (
	"person_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"groupRole" text NOT NULL,
	CONSTRAINT "persons_to_groups_person_id_group_id_pk" PRIMARY KEY("person_id","group_id")
);
--> statement-breakpoint
ALTER TABLE "persons_to_roles" RENAME TO "persons_to_system_roles";--> statement-breakpoint
ALTER TABLE "roles" RENAME TO "system_roles";--> statement-breakpoint
ALTER TABLE "persons_to_system_roles" DROP CONSTRAINT "persons_to_roles_user_id_persons_user_id_fk";
--> statement-breakpoint
ALTER TABLE "persons_to_system_roles" DROP CONSTRAINT "persons_to_roles_role_id_roles_role_id_fk";
--> statement-breakpoint
ALTER TABLE "persons_to_system_roles" DROP CONSTRAINT "persons_to_roles_user_id_role_id_pk";--> statement-breakpoint
ALTER TABLE "persons_to_system_roles" ADD CONSTRAINT "persons_to_system_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id");--> statement-breakpoint
ALTER TABLE "persons_to_groups" ADD CONSTRAINT "persons_to_groups_person_id_persons_user_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons_to_groups" ADD CONSTRAINT "persons_to_groups_group_id_groups_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons_to_system_roles" ADD CONSTRAINT "persons_to_system_roles_user_id_persons_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."persons"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons_to_system_roles" ADD CONSTRAINT "persons_to_system_roles_role_id_system_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."system_roles"("role_id") ON DELETE cascade ON UPDATE no action;