-- Migration: Add missing index on messages(room_id)
-- This index improves query performance when fetching messages for a specific room

CREATE INDEX IF NOT EXISTS messages_room_id_idx 
ON public.messages(room_id);

-- Optional: Add composite index for common query pattern (room + timestamp)
CREATE INDEX IF NOT EXISTS messages_room_id_created_at_idx 
ON public.messages(room_id, created_at DESC);
