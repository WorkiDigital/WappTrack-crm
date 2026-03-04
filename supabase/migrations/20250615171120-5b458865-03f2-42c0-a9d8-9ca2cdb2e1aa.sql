
-- Adiciona campos UTM na tabela leads para associar os dados de origem
ALTER TABLE leads ADD COLUMN utm_source text;
ALTER TABLE leads ADD COLUMN utm_medium text;
ALTER TABLE leads ADD COLUMN utm_campaign text;
ALTER TABLE leads ADD COLUMN utm_content text;
ALTER TABLE leads ADD COLUMN utm_term text;
