CREATE TYPE "UserRole" AS ENUM ('teacher', 'student', 'admin');

CREATE TYPE "JobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "slides" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "ppt_url" TEXT,
    "hash" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "presentation_cache" (
    "id" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "request_hash" TEXT NOT NULL,
    "ppt_url" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presentation_cache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE INDEX "users_role_idx" ON "users"("role");

CREATE INDEX "jobs_user_id_idx" ON "jobs"("user_id");

CREATE INDEX "jobs_status_idx" ON "jobs"("status");

CREATE INDEX "jobs_hash_idx" ON "jobs"("hash");

CREATE INDEX "jobs_created_at_idx" ON "jobs"("created_at");

CREATE UNIQUE INDEX "presentation_cache_request_hash_key" ON "presentation_cache"("request_hash");

CREATE INDEX "presentation_cache_created_at_idx" ON "presentation_cache"("created_at");

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
