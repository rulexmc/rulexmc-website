-- Aurora XP level reported by the game server (nullable: unknown until the server sends it).
ALTER TABLE "PlayerStats" ADD COLUMN "level" INTEGER;

-- Leaderboards can now be sorted by hearts and level.
CREATE INDEX "PlayerStats_hearts_idx" ON "PlayerStats"("hearts");
CREATE INDEX "PlayerStats_level_idx" ON "PlayerStats"("level");
