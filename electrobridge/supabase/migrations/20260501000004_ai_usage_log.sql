CREATE TABLE IF NOT EXISTS ai_usage_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature text NOT NULL,
  provider text NOT NULL,
  model text,
  prompt_length integer,
  response_length integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read ai_usage_log"
  ON ai_usage_log
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert ai_usage_log"
  ON ai_usage_log
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature ON ai_usage_log(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_provider ON ai_usage_log(provider);
