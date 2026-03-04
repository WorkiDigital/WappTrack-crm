
-- Adicionar campos UTM na tabela pending_leads
ALTER TABLE pending_leads ADD COLUMN utm_source text;
ALTER TABLE pending_leads ADD COLUMN utm_medium text;
ALTER TABLE pending_leads ADD COLUMN utm_campaign text;
ALTER TABLE pending_leads ADD COLUMN utm_content text;
ALTER TABLE pending_leads ADD COLUMN utm_term text;
