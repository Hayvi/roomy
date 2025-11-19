-- Add last_seen_at to room_members
ALTER TABLE public.room_members ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

-- Allow users to update their own last_seen_at
CREATE POLICY "Users can update their own last_seen_at"
  ON public.room_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Computed column to count online members (seen in last minute)
CREATE OR REPLACE FUNCTION public.online_count(room_row public.rooms)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)
  FROM public.room_members
  WHERE room_id = room_row.id
  AND last_seen_at > (now() - interval '1 minute');
$$;
