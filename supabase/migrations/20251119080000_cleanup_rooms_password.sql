-- Drop unused password column from rooms table
-- It was replaced by password_hash and room_secrets
ALTER TABLE public.rooms DROP COLUMN IF EXISTS password;
