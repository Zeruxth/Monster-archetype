-- D1 schema for the results log ("The Archetype of the Monster").
--
-- One row per completed analysis (written server-side by the Worker on the
-- `monster` step — see logResult() in index.js). Aggregate counts ("how many of
-- each monster / emotion") are computed at read time with GROUP BY, so there is
-- no separate counter table to keep in sync.
--
-- Apply it to the production DB after creating it:
--   wrangler d1 create monster-archetype-results     # prints database_id → wrangler.toml
--   wrangler d1 execute monster-archetype-results --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS results (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT    NOT NULL,   -- ISO-8601 UTC timestamp of the result
  emotion     TEXT    NOT NULL,   -- English emotion id (confusion / suspicion / ...)
  emotion_he  TEXT,               -- the emotion in Hebrew (model output)
  monster     TEXT    NOT NULL,   -- English monster name (model output, exact from the prompt list)
  monster_he  TEXT,               -- the monster in Hebrew (model output)
  culture     TEXT,               -- culture of origin, in Hebrew (model output)
  chapter     INTEGER,            -- book chapter 1-7 (model output)
  explanation TEXT,               -- the personal explanation the user was shown
  answer1     TEXT,               -- the four Rorschach responses the user wrote
  answer2     TEXT,
  answer3     TEXT,
  answer4     TEXT
);

-- Speed up the GROUP BY aggregates and time-range reads.
CREATE INDEX IF NOT EXISTS idx_results_monster ON results (monster);
CREATE INDEX IF NOT EXISTS idx_results_emotion ON results (emotion);
CREATE INDEX IF NOT EXISTS idx_results_created ON results (created_at);
