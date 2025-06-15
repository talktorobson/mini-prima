
-- Insert sample notifications for the current client
INSERT INTO portal_notifications (
  client_id,
  type,
  title,
  message,
  is_read,
  read_at,
  created_at
) VALUES 
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'document',
  'Novo documento disponível',
  'Um novo documento foi adicionado ao seu caso #12345.',
  false,
  NULL,
  NOW()
),
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'case_update',
  'Atualização do caso',
  'Seu processo teve uma atualização de status para "Em Andamento".',
  false,
  NULL,
  NOW() - INTERVAL '2 hours'
),
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'info',
  'Informação importante',
  'Prazo para envio de documentos é amanhã.',
  true,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'message',
  'Nova mensagem',
  'Você recebeu uma nova mensagem da equipe jurídica.',
  false,
  NULL,
  NOW() - INTERVAL '3 hours'
),
(
  '8665892b-f08a-43c6-bfe0-06283210d3dc',
  'payment',
  'Cobrança pendente',
  'Você possui uma fatura em aberto no valor de R$ 2.500,00.',
  false,
  NULL,
  NOW() - INTERVAL '6 hours'
);
