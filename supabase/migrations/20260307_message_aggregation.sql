-- Migration: Message Aggregation + Humanized Delivery Settings
-- Run this once in Supabase SQL Editor: https://supabase.com/dashboard/project/kdnmzyaozdssdwegdwlb/sql

-- Tabela para controle de agregação de mensagens por conversa
CREATE TABLE IF NOT EXISTS ai_processing_queue (
  lead_id UUID PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de configurações de entrega (feature flags + parâmetros)
CREATE TABLE IF NOT EXISTS message_delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'whatsapp' UNIQUE,
  feature_enabled BOOLEAN DEFAULT true,
  split_long_messages BOOLEAN DEFAULT true,
  max_chars_per_chunk INTEGER DEFAULT 200,
  simulate_typing BOOLEAN DEFAULT true,
  presence_type TEXT DEFAULT 'composing',
  short_delay_ms INTEGER DEFAULT 2000,
  medium_delay_ms INTEGER DEFAULT 3000,
  long_delay_ms INTEGER DEFAULT 4500,
  pause_between_chunks_min_ms INTEGER DEFAULT 1000,
  pause_between_chunks_max_ms INTEGER DEFAULT 3000,
  aggregation_window_ms INTEGER DEFAULT 4000,
  separate_cta_message BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insere configuração padrão para WhatsApp
INSERT INTO message_delivery_settings (channel)
VALUES ('whatsapp')
ON CONFLICT (channel) DO NOTHING;
