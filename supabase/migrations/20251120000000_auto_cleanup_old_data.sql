-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete rooms older than 7 days
  -- This will cascade delete to messages and room_members due to FK constraints
  DELETE FROM public.rooms
  WHERE created_at < (now() - interval '7 days');
  
  -- Delete storage files older than 7 days
  DELETE FROM storage.objects
  WHERE created_at < (now() - interval '7 days')
  AND bucket_id = 'chat-attachments';
  
  -- Log cleanup (optional)
  RAISE NOTICE 'Cleanup completed at %', now();
END;
$$;

-- Schedule the cleanup to run daily at 3 AM UTC
-- This checks daily but only deletes items > 7 days old
SELECT cron.schedule(
  'cleanup-old-data',           -- Job name
  '0 3 * * *',                  -- Cron expression: 3 AM daily
  $$SELECT cleanup_old_data();$$ -- SQL to execute
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO postgres;

-- You can manually run the cleanup with:
-- SELECT cleanup_old_data();

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('cleanup-old-data');
