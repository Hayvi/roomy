-- Migration: Add room name validation constraint
-- This enforces maximum room name length at the database level

ALTER TABLE public.rooms
ADD CONSTRAINT room_name_length_check 
CHECK (char_length(name) > 0 AND char_length(name) <= 50);
