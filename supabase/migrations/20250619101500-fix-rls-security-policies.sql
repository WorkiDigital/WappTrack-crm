
-- Remove conflicting permissive RLS policies that override user restrictions
-- These policies were allowing users to access data from other users

-- Drop overly permissive policies on campaigns table
DROP POLICY IF EXISTS "Allow all operations on campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Enable all operations" ON public.campaigns;

-- Drop overly permissive policies on leads table  
DROP POLICY IF EXISTS "Allow all operations on leads" ON public.leads;
DROP POLICY IF EXISTS "Enable all operations" ON public.leads;

-- Drop overly permissive policies on sales table
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
DROP POLICY IF EXISTS "Enable all operations" ON public.sales;

-- Ensure proper user-specific RLS policies exist for campaigns
CREATE POLICY "Users can view their own campaigns" ON public.campaigns
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON public.campaigns
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON public.campaigns
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON public.campaigns
FOR DELETE USING (auth.uid() = user_id);

-- Ensure proper user-specific RLS policies exist for sales
CREATE POLICY "Users can view their own sales" ON public.sales
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales" ON public.sales
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" ON public.sales
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" ON public.sales
FOR DELETE USING (auth.uid() = user_id);

-- Ensure user_id columns are not nullable where RLS depends on them
ALTER TABLE public.campaigns ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sales ALTER COLUMN user_id SET NOT NULL;

-- Add constraint to ensure leads always have a valid user_id
UPDATE public.leads SET user_id = (
  SELECT user_id FROM public.campaigns WHERE id = leads.campaign_id LIMIT 1
) WHERE user_id IS NULL AND campaign_id IS NOT NULL;

ALTER TABLE public.leads ALTER COLUMN user_id SET NOT NULL;

-- Add data integrity checks
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_user_id_check 
CHECK (user_id IS NOT NULL);

ALTER TABLE public.leads ADD CONSTRAINT leads_user_id_check 
CHECK (user_id IS NOT NULL);

ALTER TABLE public.sales ADD CONSTRAINT sales_user_id_check 
CHECK (user_id IS NOT NULL);
