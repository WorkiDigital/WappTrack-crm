
// Tipos para as respostas das funções Supabase
export interface ConversionResult {
  success: boolean;
  message?: string;
  error?: string;
  lead_id?: string;
  sqlstate?: string;
}

export interface BatchConversionResult {
  total_converted: number;
  total_errors: number;
  details: ConversionResult[];
}
