-- Create table for mobile app notifications
CREATE TABLE IF NOT EXISTS mobile_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    source TEXT DEFAULT 'mobile_landing',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_mobile_notifications_email ON mobile_notifications(email);
CREATE INDEX IF NOT EXISTS idx_mobile_notifications_created_at ON mobile_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_mobile_notifications_is_active ON mobile_notifications(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_mobile_notifications_updated_at 
    BEFORE UPDATE ON mobile_notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE mobile_notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert (for email capture)
CREATE POLICY "Allow public email capture" ON mobile_notifications
    FOR INSERT WITH CHECK (true);

-- Policy to allow authenticated users to read their own data
CREATE POLICY "Allow authenticated users to read" ON mobile_notifications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE mobile_notifications IS 'Stores email addresses for mobile app launch notifications';
COMMENT ON COLUMN mobile_notifications.email IS 'Email address for notifications';
COMMENT ON COLUMN mobile_notifications.source IS 'Source of the email capture (mobile_landing, etc.)';
COMMENT ON COLUMN mobile_notifications.metadata IS 'Additional metadata about the user or capture context';
