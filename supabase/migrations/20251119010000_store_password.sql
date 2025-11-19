-- Create room_secrets table
CREATE TABLE IF NOT EXISTS public.room_secrets (
  room_id UUID PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  password_plaintext TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.room_secrets ENABLE ROW LEVEL SECURITY;

-- Policy: Only owner can view secret
CREATE POLICY "Owners can view their room password"
  ON public.room_secrets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = room_secrets.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

-- Update create_room function to store plaintext password
CREATE OR REPLACE FUNCTION public.create_room(name_input TEXT, password_input TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_room_id UUID;
BEGIN
  -- Insert into rooms (stores hash)
  INSERT INTO public.rooms (owner_id, name, password_hash)
  VALUES (auth.uid(), name_input, extensions.crypt(password_input, extensions.gen_salt('bf')))
  RETURNING id INTO new_room_id;
  
  -- Insert into room_secrets (stores plaintext)
  INSERT INTO public.room_secrets (room_id, password_plaintext)
  VALUES (new_room_id, password_input);

  RETURN new_room_id;
END;
$$;
