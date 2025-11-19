-- Allow users to leave rooms (delete their own membership)
CREATE POLICY "Users can leave rooms"
  ON public.room_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
