-- Time added to a FREE-mode finish for uncorrected errors (already included in "durationMs").
ALTER TABLE "RaceResult" ADD COLUMN "penaltyMs" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_penalty_non_negative" CHECK ("penaltyMs" >= 0);
