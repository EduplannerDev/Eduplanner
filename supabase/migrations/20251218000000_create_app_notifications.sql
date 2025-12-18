-- Create app_notifications table
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'action_required');

CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_notifications_user_id ON app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_app_notifications_read ON app_notifications(read);
CREATE INDEX IF NOT EXISTS idx_app_notifications_created_at ON app_notifications(created_at);

-- RLS Policies
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON app_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON app_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_app_notifications_updated_at
    BEFORE UPDATE ON app_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE app_notifications IS 'Table for persistent in-app notifications';
