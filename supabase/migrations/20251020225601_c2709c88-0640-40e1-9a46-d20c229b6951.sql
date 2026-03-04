-- Create lead_messages table for chat history
CREATE TABLE IF NOT EXISTS public.lead_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_from_me BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent',
  whatsapp_message_id TEXT,
  instance_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON public.lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_sent_at ON public.lead_messages(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on lead_messages"
  ON public.lead_messages
  FOR ALL
  USING (true);

-- Enable realtime for lead_messages
ALTER TABLE public.lead_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_messages;