-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  member_count INTEGER DEFAULT 1 NOT NULL
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Users can view all rooms"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Room owners can update their rooms"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Room owners can delete their rooms"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in any room"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;