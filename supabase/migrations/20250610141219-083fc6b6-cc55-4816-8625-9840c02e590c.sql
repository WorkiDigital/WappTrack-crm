
-- Criar políticas RLS para a tabela company_settings
-- Permitir que qualquer usuário autenticado possa visualizar as configurações da empresa
CREATE POLICY "Allow authenticated users to view company settings" 
  ON public.company_settings 
  FOR SELECT 
  USING (true);

-- Permitir que qualquer usuário autenticado possa inserir configurações da empresa
CREATE POLICY "Allow authenticated users to insert company settings" 
  ON public.company_settings 
  FOR INSERT 
  WITH CHECK (true);

-- Permitir que qualquer usuário autenticado possa atualizar configurações da empresa
CREATE POLICY "Allow authenticated users to update company settings" 
  ON public.company_settings 
  FOR UPDATE 
  USING (true);

-- Permitir que qualquer usuário autenticado possa deletar configurações da empresa
CREATE POLICY "Allow authenticated users to delete company settings" 
  ON public.company_settings 
  FOR DELETE 
  USING (true);
