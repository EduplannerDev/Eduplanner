-- Add DELETE policy for app_notifications
-- Allows users to delete their own notifications

CREATE POLICY "Users can delete their own notifications"
ON app_notifications
FOR DELETE
USING (auth.uid() = user_id);
