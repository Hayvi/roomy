-- Migration: Fix member_count drift
-- This migration adds a trigger to automatically update the member_count
-- in the rooms table whenever a member joins or leaves

-- Function to update member_count
CREATE OR REPLACE FUNCTION public.update_room_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- On INSERT or DELETE, update the member_count for the affected room
  IF TG_OP = 'INSERT' THEN
    UPDATE public.rooms
    SET member_count = (
      SELECT COUNT(*)
      FROM public.room_members
      WHERE room_id = NEW.room_id
    )
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.rooms
    SET member_count = (
      SELECT COUNT(*)
      FROM public.room_members
      WHERE room_id = OLD.room_id
    )
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger on room_members table
DROP TRIGGER IF EXISTS on_room_member_change ON public.room_members;
CREATE TRIGGER on_room_member_change
  AFTER INSERT OR DELETE ON public.room_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_member_count();

-- Backfill existing member counts
UPDATE public.rooms
SET member_count = (
  SELECT COUNT(*)
  FROM public.room_members
  WHERE room_members.room_id = rooms.id
);
