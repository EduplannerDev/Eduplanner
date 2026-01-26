-- Migration: Create AI Usage Logs Table
-- Track all AI API calls for analytics and cost monitoring

-- Create the ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd DECIMAL(10, 6),
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_endpoint ON ai_usage_logs(endpoint);

-- Enable RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read (via service role, RLS is bypassed)
-- Regular users cannot access this table directly
CREATE POLICY "Admins can view ai_usage_logs"
  ON ai_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'administrador'::user_role
    )
  );

-- Insert policy for service role only (handled by service role key)
-- No insert policy for regular users

-- Create RPC function to get aggregated AI usage stats
CREATE OR REPLACE FUNCTION get_ai_usage_stats(days_back INTEGER DEFAULT 7)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_calls', (SELECT COUNT(*) FROM ai_usage_logs WHERE created_at > NOW() - (days_back || ' days')::INTERVAL),
    'total_input_tokens', (SELECT COALESCE(SUM(input_tokens), 0) FROM ai_usage_logs WHERE created_at > NOW() - (days_back || ' days')::INTERVAL),
    'total_output_tokens', (SELECT COALESCE(SUM(output_tokens), 0) FROM ai_usage_logs WHERE created_at > NOW() - (days_back || ' days')::INTERVAL),
    'total_cost_usd', (SELECT COALESCE(SUM(estimated_cost_usd), 0)::DECIMAL(10,4) FROM ai_usage_logs WHERE created_at > NOW() - (days_back || ' days')::INTERVAL),
    'avg_latency_ms', (SELECT COALESCE(AVG(latency_ms), 0)::INTEGER FROM ai_usage_logs WHERE created_at > NOW() - (days_back || ' days')::INTERVAL),
    'success_rate', (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 100
        ELSE ROUND((COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*))::NUMERIC, 2)
      END
      FROM ai_usage_logs 
      WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'calls_by_endpoint', (
      SELECT COALESCE(json_object_agg(endpoint, cnt), '{}'::JSON)
      FROM (
        SELECT endpoint, COUNT(*) as cnt 
        FROM ai_usage_logs 
        WHERE created_at > NOW() - (days_back || ' days')::INTERVAL 
        GROUP BY endpoint
        ORDER BY cnt DESC
      ) sub
    ),
    'daily_usage', (
      SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.date), '[]'::JSON)
      FROM (
        SELECT 
          DATE(created_at) as date, 
          COUNT(*) as calls, 
          COALESCE(SUM(total_tokens), 0) as tokens,
          COALESCE(SUM(estimated_cost_usd), 0)::DECIMAL(10,4) as cost
        FROM ai_usage_logs 
        WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY DATE(created_at)
        ORDER BY date
      ) sub
    ),
    'top_users', (
      SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::JSON)
      FROM (
        SELECT 
          user_id,
          COUNT(*) as calls,
          COALESCE(SUM(total_tokens), 0) as tokens
        FROM ai_usage_logs 
        WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
        AND user_id IS NOT NULL
        GROUP BY user_id
        ORDER BY calls DESC
        LIMIT 10
      ) sub
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (will be filtered by admin check in app)
GRANT EXECUTE ON FUNCTION get_ai_usage_stats TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE ai_usage_logs IS 'Tracks all AI API calls for usage analytics and cost monitoring';
COMMENT ON FUNCTION get_ai_usage_stats IS 'Returns aggregated AI usage statistics for the specified number of days';
