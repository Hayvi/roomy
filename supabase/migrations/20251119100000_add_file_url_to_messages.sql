-- Add file_url column to messages table for file attachments
ALTER TABLE public.messages 
ADD COLUMN file_url TEXT;
