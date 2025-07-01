CREATE TABLE "events" (
	"event_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"entityType" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"mandatory" boolean NOT NULL,
	"insider" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_entity_id_event_id_pk" PRIMARY KEY("entity_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_entity_id_persons_user_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."persons"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_entity_id_groups_group_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."groups"("group_id") ON DELETE cascade ON UPDATE no action;