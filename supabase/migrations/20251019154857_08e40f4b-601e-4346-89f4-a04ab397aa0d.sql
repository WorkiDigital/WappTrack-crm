-- Atualizar status existentes para o novo funil
-- Manter compatibilidade com status atuais

-- Adicionar comentário na coluna para documentar os status válidos
COMMENT ON COLUMN leads.status IS 'Status do lead no funil de vendas: new, contacted, qualified, proposal, negotiating, converted, lost, cancelled';

-- Criar índice para melhorar performance de queries por status
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Criar índice composto para queries comuns (user + status)
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads(user_id, status);

-- Atualizar status 'pending' para 'new' (se existir)
UPDATE leads SET status = 'new' WHERE status = 'pending';

-- Atualizar status 'lead' para 'contacted' (se existir)  
UPDATE leads SET status = 'contacted' WHERE status = 'lead';

-- Atualizar status 'to_recover' para 'lost' (se existir)
UPDATE leads SET status = 'lost' WHERE status = 'to_recover';