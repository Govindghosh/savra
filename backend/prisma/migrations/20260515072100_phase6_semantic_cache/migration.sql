ALTER TABLE "jobs" ADD COLUMN "subject" TEXT;

CREATE INDEX "jobs_grade_idx" ON "jobs"("grade");
