
-- Adicionar campos para palavras-chave de conversão e cancelamento
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS conversion_keywords TEXT[] DEFAULT ARRAY[
  'obrigado pela compra',
  'obrigada pela compra', 
  'venda confirmada',
  'pedido aprovado',
  'parabéns pela aquisição',
  'compra realizada',
  'vendido',
  'venda fechada',
  'negócio fechado',
  'parabéns pela compra',
  'obrigado por comprar',
  'obrigada por comprar',
  'sua compra foi',
  'compra efetuada',
  'pedido confirmado'
];

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS cancellation_keywords TEXT[] DEFAULT ARRAY[
  'compra cancelada',
  'pedido cancelado',
  'cancelamento',
  'desistiu da compra',
  'não quer mais',
  'mudou de ideia',
  'cancelar pedido',
  'estorno',
  'devolver',
  'não conseguiu pagar'
];
