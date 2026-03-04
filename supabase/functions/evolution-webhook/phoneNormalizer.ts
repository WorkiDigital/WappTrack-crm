
/**
 * Normaliza um número de telefone removendo formatação e criando variações
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  return phone.replace(/\D/g, '');
}

/**
 * Cria variações de um número de telefone para busca flexível
 * SEM adicionar ou remover dígitos - apenas variações de formato
 */
export function createPhoneVariations(phone: string): string[] {
  const normalized = normalizePhone(phone);
  const variations = new Set<string>();
  
  // Adiciona o número normalizado
  variations.add(normalized);
  
  // Variações de prefixo 55
  if (normalized.startsWith('55')) {
    variations.add(normalized.slice(2)); // Sem código do país
  } else if (normalized.length >= 10) {
    variations.add('55' + normalized); // Com código do país
  }
  
  // Variações de últimos dígitos para busca flexível
  if (normalized.length >= 11) {
    variations.add(normalized.slice(-11)); // Últimos 11 dígitos
    variations.add(normalized.slice(-10)); // Últimos 10 dígitos
  }
  
  return Array.from(variations);
}
