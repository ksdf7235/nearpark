CREATE TABLE "urban_parks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"park_type" text NOT NULL,
	"road_address" text,
	"jibun_address" text,
	"lat" double precision,
	"lng" double precision,
	"area" numeric,
	"sports_facilities" text,
	"play_facilities" text,
	"convenience_facilities" text,
	"culture_facilities" text,
	"other_facilities" text,
	"has_playground" boolean DEFAULT false,
	"has_gym" boolean DEFAULT false,
	"has_toilet" boolean DEFAULT false,
	"has_parking" boolean DEFAULT false,
	"has_bench" boolean DEFAULT false,
	"has_stage_or_culture" boolean DEFAULT false,
	"established_at" date,
	"org_name" text,
	"phone" text,
	"data_date" date,
	"provider_code" text,
	"provider_name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_urban_parks_park_type" ON "urban_parks" USING btree ("park_type");--> statement-breakpoint
CREATE INDEX "idx_urban_parks_lat_lng" ON "urban_parks" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "idx_urban_parks_facilities" ON "urban_parks" USING btree ("has_playground","has_gym","has_toilet","has_parking");