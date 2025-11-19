-- Migration: Add index on room_members(user_id)
-- This index improves query performance when finding all rooms a user is a member of

CREATE INDEX IF NOT EXISTS room_members_user_id_idx 
ON public.room_members(user_id);
