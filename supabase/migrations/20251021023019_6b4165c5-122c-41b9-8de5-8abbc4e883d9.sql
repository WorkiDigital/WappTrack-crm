-- Corrige números de telefone que perderam o 9 do celular
-- Aplica para números com 12 dígitos começando com 55 e DDD 85-99
-- Exemplo: 558598372658 → 5585998372658

UPDATE leads 
SET phone = 
  '55' || 
  SUBSTRING(phone FROM 3 FOR 2) || 
  '9' || 
  SUBSTRING(phone FROM 5)
WHERE 
  phone ~ '^55[8-9][5-9][0-9]{8}$'
  AND LENGTH(phone) = 12
  AND SUBSTRING(phone FROM 5 FOR 1) != '9';