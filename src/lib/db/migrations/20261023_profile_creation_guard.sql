ALTER TABLE profiles ADD COLUMN IF NOT EXISTS create_request_key text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_create_request_key_unique ON profiles (create_request_key);
CREATE INDEX IF NOT EXISTS profiles_guest_created_idx ON profiles (guest_token, id);
CREATE INDEX IF NOT EXISTS profiles_owner_created_idx ON profiles (owner_user_id, id);
CREATE INDEX IF NOT EXISTS profiles_guest_date_idx ON profiles (guest_token, created_at);
CREATE INDEX IF NOT EXISTS profiles_owner_date_idx ON profiles (owner_user_id, created_at);
CREATE TABLE IF NOT EXISTS course_catalog_snapshots (
  provider text PRIMARY KEY,
  fetched_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
