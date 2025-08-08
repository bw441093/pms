CREATE TABLE "events_to_groups" (
	"eventId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	CONSTRAINT "events_to_groups_eventId_groupId_pk" PRIMARY KEY("eventId","groupId"),
	CONSTRAINT "events_to_groups_eventId_events_eventId_fk" FOREIGN KEY ("eventId") REFERENCES "events"("eventId") ON DELETE CASCADE,
	CONSTRAINT "events_to_groups_groupId_groups_groupId_fk" FOREIGN KEY ("groupId") REFERENCES "groups"("groupId") ON DELETE CASCADE
); 