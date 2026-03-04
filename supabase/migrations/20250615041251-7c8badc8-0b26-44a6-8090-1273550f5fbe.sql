
-- Add advanced tracking fields to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS facebook_access_token text,
ADD COLUMN IF NOT EXISTS conversion_api_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS test_event_code text,
ADD COLUMN IF NOT EXISTS advanced_matching_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_audience_pixel_id text,
ADD COLUMN IF NOT EXISTS server_side_api_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tracking_domain text,
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS data_processing_options text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS data_processing_options_country integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_processing_options_state integer DEFAULT 0;
