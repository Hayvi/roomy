-- Migration: Add 15-member capacity limit per room
-- This uses a trigger to enforce the limit without modifying the join_room function

-- Create function to check room capacity before insert
CREATE OR REPLACE FUNCTION public.check_room_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_member_count INTEGER;
BEGIN
  -- Count current members in the room
  SELECT COUNT(*) INTO current_member_count
  FROM public.room_members
  WHERE room_id = NEW.room_id;

  -- Check if room is at capacity (15 members)
  IF current_member_count >= 15 THEN
    RAISE EXCEPTION 'Room is full (maximum 15 members)'
      USING ERRCODE = '23514'; -- check_violation error code
  END IF;

  -- Allow the insert
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce capacity before insert
CREATE TRIGGER enforce_room_capacity
  BEFORE INSERT ON public.room_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_room_capacity();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_room_capacity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_room_capacity() TO anon;
