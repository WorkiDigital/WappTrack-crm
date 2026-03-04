/**
 * Seed de Agente - WappTrack CRM
 * Preenche o agente com dados de teste completos (etapas, variáveis, exemplos, base de conhecimento)
 *
 * Como usar:
 *   node seed-agent.js
 *
 * Obs: usa a chave publishable do Supabase.
 * Se houver erro de permissão, forneça a service_role key:
 *   SUPABASE_SERVICE_KEY=sua_chave node seed-agent.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kdnmzyaozdssdwegdwlb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_ZvmA71N46SN69xQZsgRZxQ_I8QBZ8uo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Dados do Agente ──────────────────────────────────────────────────────────

const AGENT_BEHAVIOR = {
  name: 'Bryan SDR',
  persona_name: 'Bryan',
  function: 'Qualificar leads interessados em consultoria de marketing digital, entender o problema deles, apresentar a solução e agendar uma reunião com o consultor.',
  behavior_rules: `- Seja sempre cordial, empático e profissional.
- Use linguagem informal mas respeitosa (tutear).
- Nunca invente informações sobre o produto. Se não souber, diga que o consultor vai explicar.
- Use emojis com moderação (1-2 por mensagem).
- Respostas curtas e diretas (máximo 3 parágrafos).
- Nunca mencione o preço diretamente. Diga que o valor é apresentado na reunião.
- Se o lead parecer desinteressado, tente entender a objeção antes de desistir.
- Nunca pressione para comprar. Foque em ajudar.`
};

const STAGES = [
  {
    name: '1. Boas-vindas e Qualificação',
    stage_order: 1,
    funnel_status: 'new',
    objective: 'Entender o contexto do lead: quem é, qual o negócio dele e qual o principal problema ou objetivo que trouxe ele até aqui.',
    success_criteria: 'Lead informou nome, segmento do negócio e principal desafio/objetivo. Avançar quando todos esses dados forem coletados.',
    variables: [
      { field_name: 'nome', description: 'Nome completo do lead', is_required: true },
      { field_name: 'negocio', description: 'Segmento ou tipo de negócio do lead', is_required: true },
      { field_name: 'desafio', description: 'Principal problema ou objetivo do lead', is_required: true },
    ],
    examples: [
      'Oi! 👋 Seja bem-vindo! Sou o Bryan, consultor de marketing digital. Vi que você tem interesse em crescer seu negócio online — adorei! \n\nPra eu te ajudar melhor, me conta: como você se chama e qual é o seu negócio?',
      'Que incrível! Muitos empreendedores do seu segmento passam exatamente por esse desafio. Você está no lugar certo 💪\n\nMe conta um pouco mais: qual é o principal obstáculo que está te impedindo de crescer hoje?',
    ]
  },
  {
    name: '2. Apresentação da Solução',
    stage_order: 2,
    funnel_status: 'contacted',
    objective: 'Apresentar como a consultoria pode resolver o problema do lead, despertar interesse e validar se ele tem disponibilidade e interesse em avançar.',
    success_criteria: 'Lead demonstrou interesse na solução e confirmou que quer saber mais. Avançar quando o lead disser que quer continuar ou perguntar sobre próximos passos.',
    variables: [
      { field_name: 'interesse_nivel', description: 'Nível de interesse do lead (alto/médio/baixo)', is_required: false },
      { field_name: 'objecao', description: 'Principal objeção ou dúvida do lead', is_required: false },
    ],
    examples: [
      'Entendo perfeitamente! 🎯 Esse é exatamente o tipo de situação que nossa consultoria resolve.\n\nTrabalhamos com negócios como o seu para estruturar a presença digital, atrair clientes qualificados e converter mais — tudo com estratégia personalizada.\n\nVocê toparia uma conversa rápida com um dos nossos consultores pra ver se faz sentido pro seu negócio?',
      'Ótima pergunta! Os resultados variam de negócio pra negócio, mas geralmente nossos clientes começam a ver resultados nos primeiros 30-60 dias 📈\n\nO melhor é você conversar diretamente com o especialista, ele vai montar um plano específico pra você. Faz sentido?',
    ]
  },
  {
    name: '3. Agendamento de Reunião',
    stage_order: 3,
    funnel_status: 'qualified',
    objective: 'Coletar a data e horário de preferência do lead para agendar uma reunião com o consultor.',
    success_criteria: 'Lead confirmou data e horário de disponibilidade para a reunião. Avançar quando a data estiver confirmada.',
    variables: [
      { field_name: 'data_disponivel', description: 'Data e horário que o lead tem disponibilidade para a reunião', is_required: true },
      { field_name: 'email', description: 'Email do lead para enviar o link da reunião', is_required: true },
    ],
    examples: [
      'Perfeito! 🗓️ Vou agendar uma conversa de 30 minutinhos com nosso consultor — sem compromisso, só pra entender seu cenário e ver como podemos te ajudar.\n\nQual o melhor dia e horário pra você essa semana? Temos manhãs e tardes disponíveis.',
      'Ótimo! Só pra confirmar o agendamento, qual é o seu melhor email? Vou enviar o link da reunião por lá 😊',
      'Reunião confirmada! ✅ Você vai receber o link no seu email em breve.\n\nNosso consultor vai estar preparado pra te ajudar com tudo que conversamos. Qualquer dúvida, pode me chamar aqui. Até lá! 🚀',
    ]
  }
];

const KNOWLEDGE_BASE = {
  name: 'FAQ e Produto - Consultoria Marketing Digital',
  content: `# Consultoria de Marketing Digital - Informações para o Agente

## Sobre a Empresa
Somos uma consultoria de marketing digital especializada em negócios locais e infoprodutores. Ajudamos empreendedores a atrair mais clientes, estruturar a presença online e aumentar o faturamento com estratégias personalizadas.

## O que oferecemos
- Estratégia de tráfego pago (Google Ads, Meta Ads)
- Gestão de redes sociais e criação de conteúdo
- Funis de vendas e automação de marketing
- Consultoria individual com plano de ação personalizado
- Acompanhamento mensal de resultados

## Como funciona
1. Reunião de diagnóstico gratuita (30 min) com um consultor
2. Apresentação do plano personalizado
3. Proposta comercial adaptada ao orçamento do cliente
4. Execução e acompanhamento mensal

## Público-alvo
- Pequenas e médias empresas
- Profissionais liberais (médicos, advogados, dentistas)
- E-commerces
- Infoprodutores e criadores de conteúdo
- Negócios locais (restaurantes, academias, salões)

## Objeções comuns e como responder
- "Já tentei e não funcionou": Cada estratégia é personalizada, o diagnóstico gratuito mostrará o que vai funcionar para o SEU negócio.
- "É muito caro": O valor é apresentado na reunião, após entender o negócio. Trabalhamos com diferentes pacotes.
- "Não tenho tempo": A consultoria é feita para que você foque no negócio, deixamos o marketing com a gente.
- "Preciso pensar": Totalmente válido! A reunião não tem compromisso, é só pra entender o contexto.

## Resultados esperados
- Aumento de visibilidade online em 30 dias
- Leads qualificados em 45-60 dias
- ROI positivo em 90 dias (para a maioria dos negócios)

## O que NÃO dizer
- Nunca mencione preços específicos (apresentados na reunião)
- Nunca prometa resultados garantidos em tempo fixo
- Nunca fale mal de concorrentes

## Horários de atendimento (reuniões)
- Segunda a Sexta: 9h às 18h
- Sábado: 9h às 12h (horários limitados)
`
};

const TRIGGER_PHRASE = 'consultoria';

// ── Script principal ──────────────────────────────────────────────────────────

async function seed() {
  console.log('🚀 Iniciando seed do agente...\n');

  // 1. Buscar agente existente (Bryan ou primeiro disponível)
  const { data: agents, error: agentErr } = await supabase
    .from('agents')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(5);

  if (agentErr) {
    console.error('❌ Erro ao buscar agentes:', agentErr.message);
    console.log('\n⚠️  Provavelmente precisa da service_role key:');
    console.log('   SUPABASE_SERVICE_KEY=sua_chave node seed-agent.js\n');
    process.exit(1);
  }

  if (!agents || agents.length === 0) {
    console.error('❌ Nenhum agente encontrado. Crie um agente na UI primeiro.');
    process.exit(1);
  }

  // Prioriza Bryan, senão usa o primeiro
  const agent = agents.find(a => a.name.toLowerCase().includes('bryan')) || agents[0];
  console.log(`✅ Agente encontrado: "${agent.name}" (id: ${agent.id})\n`);

  // 2. Atualizar comportamento do agente
  console.log('📝 Atualizando comportamento do agente...');
  const { error: behaviorErr } = await supabase
    .from('agents')
    .update(AGENT_BEHAVIOR)
    .eq('id', agent.id);

  if (behaviorErr) {
    console.error('❌ Erro ao atualizar comportamento:', behaviorErr.message);
  } else {
    console.log('   ✅ Comportamento atualizado');
  }

  // 3. Remover etapas existentes (e em cascata: variáveis e exemplos)
  console.log('\n🗑️  Removendo etapas existentes...');
  const { data: existingStages } = await supabase
    .from('agent_stages')
    .select('id')
    .eq('agent_id', agent.id);

  for (const stage of (existingStages || [])) {
    await supabase.from('stage_variables').delete().eq('stage_id', stage.id);
    await supabase.from('stage_examples').delete().eq('stage_id', stage.id);
    await supabase.from('agent_stages').delete().eq('id', stage.id);
  }
  console.log(`   ✅ ${existingStages?.length || 0} etapa(s) removida(s)`);

  // 4. Criar etapas com variáveis e exemplos
  console.log('\n📋 Criando etapas...');
  for (const stageData of STAGES) {
    const { variables, examples, ...stageFields } = stageData;

    const { data: stage, error: stageErr } = await supabase
      .from('agent_stages')
      .insert({ ...stageFields, agent_id: agent.id, is_active: true })
      .select('id')
      .single();

    if (stageErr || !stage) {
      console.error(`   ❌ Erro ao criar etapa "${stageData.name}":`, stageErr?.message);
      continue;
    }

    console.log(`   ✅ Etapa criada: "${stageData.name}"`);

    // Variáveis
    for (const v of variables) {
      const { error: varErr } = await supabase
        .from('stage_variables')
        .insert({ ...v, stage_id: stage.id });
      if (varErr) console.error(`      ⚠️  Variável "${v.field_name}":`, varErr.message);
      else console.log(`      📌 Variável: ${v.field_name}`);
    }

    // Exemplos
    for (const msg of examples) {
      const { error: exErr } = await supabase
        .from('stage_examples')
        .insert({ stage_id: stage.id, role: 'assistant', message: msg });
      if (exErr) console.error(`      ⚠️  Exemplo:`, exErr.message);
      else console.log(`      💬 Exemplo adicionado`);
    }
  }

  // 5. Criar base de conhecimento
  console.log('\n📚 Criando base de conhecimento...');

  // Buscar user_id do agente
  const { data: agentFull } = await supabase
    .from('agents')
    .select('user_id')
    .eq('id', agent.id)
    .single();

  const userId = agentFull?.user_id || '00000000-0000-0000-0000-000000000000';

  // Remover KB antigas vinculadas
  await supabase.from('agent_knowledge_bases').delete().eq('agent_id', agent.id);

  const { data: kb, error: kbErr } = await supabase
    .from('knowledge_bases')
    .insert({ ...KNOWLEDGE_BASE, user_id: userId })
    .select('id')
    .single();

  if (kbErr || !kb) {
    console.error('   ❌ Erro ao criar base de conhecimento:', kbErr?.message);
  } else {
    console.log(`   ✅ Base criada: "${KNOWLEDGE_BASE.name}"`);

    // Vincular ao agente
    const { error: linkErr } = await supabase
      .from('agent_knowledge_bases')
      .insert({ agent_id: agent.id, knowledge_base_id: kb.id, is_enabled: true });

    if (linkErr) console.error('   ❌ Erro ao vincular:', linkErr.message);
    else console.log('   🔗 Base vinculada ao agente');
  }

  // 6. Criar trigger
  console.log('\n⚡ Configurando trigger...');
  await supabase.from('agent_triggers').delete().eq('agent_id', agent.id);

  const { error: triggerErr } = await supabase
    .from('agent_triggers')
    .insert({ agent_id: agent.id, phrase: TRIGGER_PHRASE });

  if (triggerErr) console.error('   ❌ Erro ao criar trigger:', triggerErr.message);
  else console.log(`   ✅ Trigger configurado: "${TRIGGER_PHRASE}"`);

  console.log('\n🎉 Seed concluído com sucesso!\n');
  console.log('='.repeat(50));
  console.log('Agente: ' + AGENT_BEHAVIOR.name);
  console.log('Persona: ' + AGENT_BEHAVIOR.persona_name);
  console.log('Etapas: ' + STAGES.length);
  console.log('Base de conhecimento: ' + KNOWLEDGE_BASE.name);
  console.log('Trigger: "' + TRIGGER_PHRASE + '"');
  console.log('='.repeat(50));
}

seed().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
