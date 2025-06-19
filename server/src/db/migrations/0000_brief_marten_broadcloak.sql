CREATE TABLE "persons" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"site" text NOT NULL,
	"manager_id" uuid,
	"alertStatus" text DEFAULT 'good' NOT NULL,
	"reportStatus" text DEFAULT 'present' NOT NULL,
	"location" text DEFAULT 'home' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons_to_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "persons_to_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"role_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"opts" json
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin" text NOT NULL,
	"target" text NOT NULL,
	"originConfirmation" boolean DEFAULT false NOT NULL,
	"targetConfirmation" boolean DEFAULT false NOT NULL,
	"field" text DEFAULT 'site' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"twoFactorSecret" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_manager_id_persons_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."persons"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons_to_roles" ADD CONSTRAINT "persons_to_roles_user_id_persons_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."persons"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons_to_roles" ADD CONSTRAINT "persons_to_roles_role_id_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_persons_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."persons"("user_id") ON DELETE cascade ON UPDATE no action;