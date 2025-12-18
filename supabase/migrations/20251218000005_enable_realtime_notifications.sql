-- Enable Realtime for app_notifications table
-- This is required for the client to receive updates via subscription

BEGIN;
  -- Add table to publication if it exists (standard Supabase setup)
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE app_notifications;
    END IF;
  END
  $$;
COMMIT;
