-- Migration: Add display name support for anonymous authentication
-- This migration adds display_name to profiles and makes email nullable

-- Add display_name column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Make email nullable (for anonymous users)
ALTER TABLE public.profiles 
ALTER COLUMN email DROP NOT NULL;

-- Add unique constraint on display_name (prevents duplicate names)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_display_name_unique UNIQUE (display_name);

-- Update the handle_new_user trigger to handle display_name
-- (Will be set by the frontend after anonymous sign-in)
