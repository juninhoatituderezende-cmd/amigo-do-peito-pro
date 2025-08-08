-- Enable the pgcrypto extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to generate random bytes if it doesn't exist
CREATE OR REPLACE FUNCTION gen_random_bytes(count integer)
RETURNS bytea AS $$
BEGIN
  RETURN gen_random_uuid()::text::bytea;
END;
$$ LANGUAGE plpgsql;