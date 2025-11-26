CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"road_address" text,
	"jibun_address" text,
	"normalized_address" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"phone" text,
	"url" text,
	"image_url" text,
	"tags" text[],
	"park_type" text,
	"area" text,
	"has_playground" boolean DEFAULT false,
	"has_gym" boolean DEFAULT false,
	"has_toilet" boolean DEFAULT false,
	"has_parking" boolean DEFAULT false,
	"has_bench" boolean DEFAULT false,
	"has_stage_or_culture" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "places_address_location_unique" UNIQUE("normalized_address","lat","lng")
);
--> statement-breakpoint
CREATE INDEX "idx_places_category" ON "places" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_places_source" ON "places" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_places_source_id" ON "places" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX "idx_places_lat_lng" ON "places" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "idx_places_normalized_address" ON "places" USING btree ("normalized_address");