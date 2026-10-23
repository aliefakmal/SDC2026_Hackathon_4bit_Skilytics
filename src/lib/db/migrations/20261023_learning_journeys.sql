CREATE TABLE IF NOT EXISTS learning_journeys (
  profile_id integer PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
