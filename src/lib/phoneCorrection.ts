
import { toast } from "sonner";

export const correctPhoneNumber = (phone: string): string => {
  // Apenas normaliza removendo caracteres não numéricos
  // NÃO remove ou adiciona dígitos
  return phone.replace(/\D/g, '');
};

export const shouldCorrectPhone = (phone: string): boolean => {
  // Verifica se tem caracteres não numéricos que precisam ser removidos
  return /\D/.test(phone);
};

// Cria variações de busca do número SEM adicionar ou remover dígitos
export const createPhoneSearchVariations = (phone: string): string[] => {
  const normalized = correctPhoneNumber(phone);
  const variations = new Set<string>();
  
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
};
