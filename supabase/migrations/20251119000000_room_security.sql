-- Add password column to rooms
ALTER TABLE public.rooms ADD COLUMN password TEXT DEFAULT substring(md5(random()::text) from 0 for 7) NOT NULL;

-- Remove default value after backfill so new inserts must provide it (or we keep it as a fallback)
-- Actually, let's keep the default random generation in the DB as a fallback, but the app should probably generate it or we let DB do it.
-- The user said "whenever a user create a room a , password get generated".
-- We can let the DB generate it if not provided.

-- Create room_members table
CREATE TABLE public.room_members (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

-- Enable RLS on room_members
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- RLS for room_members
CREATE POLICY "Users can view their own memberships"
  ON public.room_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS for rooms (Update existing policies)
-- We need to ensure people can SEE the room exists to join it, so "view all rooms" is actually fine for the list.
-- But we might want to hide the password?
-- Postgres RLS doesn't support column-level security easily in the same table for SELECT.
-- However, if we just select 'id', 'name', 'member_count' in the list, it's fine.
-- But if we select *, we get the password.
-- Ideally, the password should NOT be visible to non-members.
-- But the creator needs to see it.
-- And members might need to see it? No, they just need to have used it.
-- Actually, if the password is just for joining, maybe only the owner should see it.
-- Let's restrict 'password' column visibility if possible, or just be careful in the API.
-- For now, let's keep it simple: Owner can see everything. Others can see public info.
-- But wait, if I do `select * from rooms`, I get the password.
-- A better approach is a security definer function to join, and maybe a view or just careful selection.
-- Let's stick to the plan: "rooms: Visible to all (so they can try to join)".
-- We will rely on the frontend not to show the password unless you are the owner.
-- (Note: This is not perfectly secure if someone manually queries the API, they could get the password.
--  To make it truly secure, we would need to separate the password into a private table or use a hash.
--  But the user asked for a "password generated" that users "have", implying it's a shared secret.
--  If we hash it, we can't show it to the owner again if they forget, unless we only show it once on creation.
--  The user's image shows "Success Room created successfully" but doesn't explicitly show the password being displayed permanently.
--  However, usually "password generated" implies it's a shared key.
--  Let's assume for this level of app, storing it plain text is acceptable BUT we should try to hide it from non-owners if possible.
--  Actually, if we use RLS, we can't hide just one column.
--  Let's make the `rooms` table NOT public, but create a view or just allow public select and accept the risk for this iteration,
--  OR, better: Create a function `get_public_rooms` that returns everything EXCEPT password.
--  And revoke SELECT on `rooms` for authenticated? No, that breaks things.
--  Let's stick to: Public can select rooms. We trust the client for now, OR we can implement a hash.
--  If I hash it, I can't show it.
--  Let's generate it, return it ONCE to the creator, store it HASHED.
--  User said: "only users that have that password could join".
--  If I store it hashed, I can verify it.
--  Can I show it to the creator? Yes, return it from the INSERT.
--  So:
--  1. App generates password (or DB generates and returns it).
--  2. DB stores Hash.
--  3. Creator sees it once.
--  4. Joiners send password, DB verifies Hash.
--  This is much more secure. I will do this.)

-- Wait, the user said "password get generated".
-- I'll make the `password` column store the HASH.
-- And I'll make a function to create room that returns the plain password?
-- Or just let the client generate the password, send the hash to DB?
-- Client generating password is easier.
-- "whenever a user create a room a , password get generated"
-- I will implement: Client generates random password, sends Hash to DB.
-- Wait, if client generates it, they have it.
-- But if I want the DB to enforce "password generated", maybe DB trigger?
-- Let's keep it simple:
-- 1. `rooms` table has `password_hash`.
-- 2. `rooms` table has `salt` (optional, or part of hash).
-- 3. When creating room, Client calls RPC `create_room_with_password`?
--    Or Client generates password, hashes it, sends to standard insert?
--    If Client sends hash, then we need to trust Client to show the plain text to user.
--    That seems fine.
--    Actually, checking the images... The user didn't show the password being displayed.
--    But logically, if it's generated, it must be shown.
--    I will implement: Client generates password, shows it to user, sends HASH to DB.
--    Wait, if I do that, I need to update the `rooms` table to store `password_hash`.

-- Let's refine the plan for the Migration:
-- 1. Add `password_hash` to rooms.
-- 2. Create `room_members`.
-- 3. Function `join_room(room_i-- Add password column to rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT 'not_set';

-- Enable pgcrypto extension
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Backfill existing rooms with a known hash
UPDATE public.rooms SET password_hash = extensions.crypt('123456', extensions.gen_salt('bf'));

-- Create room_members
CREATE TABLE IF NOT EXISTS public.room_members (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships"
  ON public.room_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-add owner to room_members on room creation
CREATE OR REPLACE FUNCTION public.handle_new_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id)
  VALUES (NEW.id, NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_room_created
  AFTER INSERT ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_room();

-- Backfill owners into room_members
INSERT INTO public.room_members (room_id, user_id)
SELECT id, owner_id FROM public.rooms
ON CONFLICT DO NOTHING;

-- Secure Join Function
CREATE OR REPLACE FUNCTION public.join_room(room_id UUID, password_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  room_password_hash TEXT;
BEGIN
  -- Get the room's password hash
  SELECT password_hash INTO room_password_hash
  FROM public.rooms
  WHERE id = room_id;

  IF room_password_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify password
  IF room_password_hash = extensions.crypt(password_input, room_password_hash) THEN
    -- Add to members
    INSERT INTO public.room_members (room_id, user_id)
    VALUES (room_id, auth.uid())
    ON CONFLICT DO NOTHING;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Create Room Function
CREATE OR REPLACE FUNCTION public.create_room(name_input TEXT, password_input TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_room_id UUID;
BEGIN
  INSERT INTO public.rooms (owner_id, name, password_hash)
  VALUES (auth.uid(), name_input, extensions.crypt(password_input, extensions.gen_salt('bf')))
  RETURNING id INTO new_room_id;
  
  RETURN new_room_id;
END;
$$;


-- Update RLS for Messages
DROP POLICY "Users can view messages in any room" ON public.messages;

CREATE POLICY "Members can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_members.room_id = messages.room_id
      AND room_members.user_id = auth.uid()
    )
  );

-- Update RLS for Rooms (optional, but good to keep public list)
-- We leave "Users can view all rooms" as is, so they can see the list to click and join.
