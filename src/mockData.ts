import {
  Aluno,
  Parcela,
  ParcelaHistorico,
  WhatsAppMensagem,
  CobrancaRegra,
  CrmConfig,
  LogAtividade,
  Colaborador
} from './types';
import { generateParcelas, novoHistorico } from './utils/parcelas';

export const INITIAL_POLOS: string[] = ['Teresina (Sede)', 'Parnaíba', 'Floriano', 'Picos'];

export const INITIAL_CURSOS: string[] = [
  'Pós-Graduação em Neuropsicologia Clínica',
  'Especialização em Análise do Comportamento Aplicada (ABA)',
  'Pós-Graduação em Psicopedagogia Institucional',
  'Aperfeiçoamento em Transtorno do Espectro Autista (TEA)',
  'MBA em Gestão Escolar e Políticas Públicas'
];

export const INITIAL_ALUNOS: Aluno[] = [
  {
    id: 'student-1',
    nome: 'Mariana Silva Santos',
    cpf: '123.456.789-00',
    matricula: '2025-0043',
    curso: 'Pós-Graduação em Neuropsicologia Clínica',
    polo: 'Teresina (Sede)',
    whatsapp: '+55 (86) 99876-5432',
    email: 'mariana.silva@sentidos.edu.br',
    statusFinanceiro: 'EM_DIA',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    cadastroData: '2025-01-15',
    modalidade: 'Presencial',
    cobrancaAutomatica: true,
    turma: '2025.2',
    valorMensalidade: 450.0,
    totalParcelas: 18,
    parcelasPagas: 7,
    primeiroVencimentoEmAberto: '10/06/2026',
    diaVencimento: 10,
    dataMatriculaFinanceira: '15/01/2025'
  },
  {
    id: 'student-2',
    nome: 'Ricardo Antunes de Moura',
    cpf: '234.567.890-11',
    matricula: '2024-0512',
    curso: 'Especialização em Análise do Comportamento Aplicada (ABA)',
    polo: 'Parnaíba',
    whatsapp: '+55 (86) 99421-8899',
    email: 'ricardo.moura@gmail.com',
    statusFinanceiro: 'PENDENTE',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    cadastroData: '2024-08-10',
    modalidade: 'Online',
    cobrancaAutomatica: true,
    turma: '2024.1',
    valorMensalidade: 380.0,
    totalParcelas: 12,
    parcelasPagas: 3,
    primeiroVencimentoEmAberto: '15/05/2026',
    diaVencimento: 15,
    dataMatriculaFinanceira: '10/08/2024'
  },
  {
    id: 'student-3',
    nome: 'Camila Guimarães Rocha',
    cpf: '345.678.901-22',
    matricula: '2025-0012',
    curso: 'Pós-Graduação em Psicopedagogia Institucional',
    polo: 'Teresina (Sede)',
    whatsapp: '+55 (86) 99199-3122',
    email: 'camila.rocha@hotmail.com',
    statusFinanceiro: 'INADIMPLENTE',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    cadastroData: '2025-01-11',
    modalidade: 'Presencial',
    cobrancaAutomatica: true,
    turma: '2025.1',
    valorMensalidade: 380.0,
    totalParcelas: 18,
    parcelasPagas: 2,
    primeiroVencimentoEmAberto: '12/03/2026',
    diaVencimento: 12,
    dataMatriculaFinanceira: '11/01/2025'
  },
  {
    id: 'student-4',
    nome: 'Bernardo Souza Nogueira',
    cpf: '456.789.012-33',
    matricula: '2025-0089',
    curso: 'Aperfeiçoamento em Transtorno do Espectro Autista (TEA)',
    polo: 'Floriano',
    whatsapp: '+55 (86) 99555-1234',
    email: 'bernardo.s.n@outlook.com',
    statusFinanceiro: 'EM_DIA',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    cadastroData: '2025-02-01',
    modalidade: 'Presencial',
    cobrancaAutomatica: true,
    turma: '2025.2',
    valorMensalidade: 290.0,
    totalParcelas: 10,
    parcelasPagas: 5,
    primeiroVencimentoEmAberto: '22/07/2026',
    diaVencimento: 22,
    dataMatriculaFinanceira: '01/02/2025'
  },
  {
    id: 'student-5',
    nome: 'Fernanda Lima Oliveira',
    cpf: '567.890.123-44',
    matricula: '2024-0391',
    curso: 'MBA em Gestão Escolar e Políticas Públicas',
    polo: 'Picos',
    whatsapp: '+55 (86) 98844-0011',
    email: 'fernandal@faepi.edu.br',
    statusFinanceiro: 'INADIMPLENTE',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    cadastroData: '2024-05-18',
    modalidade: 'Online',
    cobrancaAutomatica: true,
    turma: '2024.2',
    valorMensalidade: 380.0,
    totalParcelas: 24,
    parcelasPagas: 10,
    primeiroVencimentoEmAberto: '10/04/2026',
    diaVencimento: 10,
    dataMatriculaFinanceira: '18/05/2024'
  },
  {
    id: 'student-6',
    nome: 'Diego Rodrigues de Aguiar',
    cpf: '678.890.342-99',
    matricula: '2025-0105',
    curso: 'Pós-Graduação em Neuropsicologia Clínica',
    polo: 'Teresina (Sede)',
    whatsapp: '+55 (86) 99611-3040',
    email: 'diego.aguiar@hotmail.com',
    statusFinanceiro: 'EM_DIA',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    cadastroData: '2025-03-10',
    modalidade: 'Presencial',
    cobrancaAutomatica: true,
    turma: '2025.2',
    valorMensalidade: 450.0,
    totalParcelas: 18,
    parcelasPagas: 4,
    primeiroVencimentoEmAberto: '10/08/2026',
    diaVencimento: 10,
    dataMatriculaFinanceira: '10/03/2025'
  },
  {
    id: 'student-7',
    nome: 'Ana Beatryz Fernandes',
    cpf: '789.213.904-88',
    matricula: '2024-0711',
    curso: 'Especialização em Análise do Comportamento Aplicada (ABA)',
    polo: 'Parnaíba',
    whatsapp: '+55 (86) 98112-9011',
    email: 'anabeatryz@gmail.com',
    statusFinanceiro: 'PENDENTE',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    cadastroData: '2024-09-02',
    modalidade: 'Online',
    cobrancaAutomatica: true,
    turma: '2024.1',
    valorMensalidade: 420.0,
    totalParcelas: 12,
    parcelasPagas: 6,
    primeiroVencimentoEmAberto: '22/06/2026',
    diaVencimento: 22,
    dataMatriculaFinanceira: '02/09/2024'
  },
  {
    id: 'student-8',
    nome: 'Gustavo Pinheiro Neto',
    cpf: '890.111.222-33',
    matricula: '2024-0612',
    curso: 'MBA em Gestão Escolar e Políticas Públicas',
    polo: 'Picos',
    whatsapp: '+55 (86) 99842-8877',
    email: 'gustavo.pinheiro@ig.com.br',
    statusFinanceiro: 'EM_DIA',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    cadastroData: '2024-07-20',
    modalidade: 'Presencial',
    cobrancaAutomatica: true,
    turma: '2024.2',
    valorMensalidade: 380.0,
    totalParcelas: 24,
    parcelasPagas: 12,
    primeiroVencimentoEmAberto: '25/07/2026',
    diaVencimento: 25,
    dataMatriculaFinanceira: '20/07/2024'
  },
  {
    id: 'student-9',
    nome: 'Letícia Guedes Cavalcante',
    cpf: '901.333.444-55',
    matricula: '2025-0211',
    curso: 'Aperfeiçoamento em Transtorno do Espectro Autista (TEA)',
    polo: 'Floriano',
    whatsapp: '+55 (86) 99123-5566',
    email: 'leticia.guedes@sentidos.edu.br',
    statusFinanceiro: 'INADIMPLENTE',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150',
    cadastroData: '2025-02-15',
    modalidade: 'Online',
    cobrancaAutomatica: true,
    turma: '2025.1',
    valorMensalidade: 480.0,
    totalParcelas: 18,
    parcelasPagas: 1,
    primeiroVencimentoEmAberto: '05/03/2026',
    diaVencimento: 5,
    dataMatriculaFinanceira: '15/02/2025'
  },
  {
    id: 'student-10',
    nome: 'Thiago Martins Fonseca',
    cpf: '012.555.666-77',
    matricula: '2025-0301',
    curso: 'Pós-Graduação em Psicopedagogia Institucional',
    polo: 'Teresina (Sede)',
    whatsapp: '+55 (86) 99612-4422',
    email: 'thiagomFonseca@gmail.com',
    statusFinanceiro: 'EM_DIA',
    valorPendente: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    cadastroData: '2025-03-25',
    modalidade: 'Presencial',
    cobrancaAutomatica: true,
    turma: '2025.2',
    valorMensalidade: 380.0,
    totalParcelas: 18,
    parcelasPagas: 8,
    primeiroVencimentoEmAberto: '25/07/2026',
    diaVencimento: 25,
    dataMatriculaFinanceira: '25/03/2025'
  }
];

// Gera as parcelas em aberto de cada matrícula financeira demo.
const parcelasGeradas: Parcela[] = INITIAL_ALUNOS.flatMap(a => generateParcelas(a, [], 'MATRICULA'));

const historicoSeed: ParcelaHistorico[] = [];

// Enriquecimento do demo: alguns pagamentos e uma negociação recuperada.
const marcarPaga = (p: Parcela | undefined, dataPagamento: string) => {
  if (!p) return;
  p.status = 'PAGO';
  p.dataPagamento = dataPagamento;
  p.atualizadoEm = new Date().toISOString();
  historicoSeed.push(novoHistorico(p.id, p.alunoId, 'Pagamento registrado', `Parcela ${p.numeroParcela}/${p.totalParcelas} quitada`));
};

const firstParcela = (alunoId: string, numero: number) =>
  parcelasGeradas.find(p => p.alunoId === alunoId && p.numeroParcela === numero);

// Mariana: 1ª parcela em aberto paga → fica em dia (demais futuras).
marcarPaga(firstParcela('student-1', 8), '10/06/2026');

// Bernardo e Gustavo já com a primeira em aberto paga.
marcarPaga(firstParcela('student-4', 6), '20/07/2026');
marcarPaga(firstParcela('student-8', 13), '24/07/2026');

// Ricardo: negociação concluída com sucesso (Receita Recuperada).
const ricardoAtrasada = firstParcela('student-2', 4);
if (ricardoAtrasada) {
  ricardoAtrasada.status = 'NEGOCIADO';
  ricardoAtrasada.atualizadoEm = new Date().toISOString();
  historicoSeed.push(novoHistorico(ricardoAtrasada.id, ricardoAtrasada.alunoId, 'Status alterado para NEGOCIADO', 'Acordo de parcelamento criado'));
  // Parcela renegociada paga: original 380 → acordado 280 (recuperado).
  const nowIso = new Date().toISOString();
  const recuperada: Parcela = {
    id: `parc-acordo-${ricardoAtrasada.alunoId}`,
    alunoId: ricardoAtrasada.alunoId,
    alunoNome: ricardoAtrasada.alunoNome,
    curso: ricardoAtrasada.curso,
    turma: ricardoAtrasada.turma,
    polo: ricardoAtrasada.polo,
    numeroParcela: 100,
    totalParcelas: ricardoAtrasada.totalParcelas,
    competencia: '06/2026',
    vencimento: '10/06/2026',
    valorOriginal: 380.0,
    valorAtual: 280.0,
    status: 'PAGO',
    origem: 'NEGOCIACAO',
    dataPagamento: '09/06/2026',
    observacoes: 'Acordo de quitação com desconto',
    enviadoWhatsAppCount: 0,
    criadoEm: nowIso,
    atualizadoEm: nowIso
  };
  parcelasGeradas.push(recuperada);
  historicoSeed.push(novoHistorico(recuperada.id, recuperada.alunoId, 'Acordo concluído', 'Pagamento recuperado via negociação'));
}

export const INITIAL_PARCELAS: Parcela[] = parcelasGeradas;
export const INITIAL_PARCELA_HISTORICO: ParcelaHistorico[] = historicoSeed;

export const INITIAL_WHATSAPP_MENSAGENS: WhatsAppMensagem[] = [
  {
    id: 'msg-1',
    alunoId: 'student-2',
    tipo: 'SISTEMA',
    texto: 'Olá Ricardo Antunes de Moura 👋 Identificamos que sua mensalidade encontra-se em aberto. Parcela: 04/12, Vencimento: 15/05/2026, Valor: R$ 380,00. Caso já tenha efetuado o pagamento, desconsidere esta mensagem.',
    dataHora: '2026-05-16T09:00:00Z',
    statusEnvio: 'LIDO'
  },
  {
    id: 'msg-2',
    alunoId: 'student-2',
    tipo: 'HUMANO_CLIENTE',
    texto: 'Bom dia! Gostaria de pedir se há possibilidade de parcelar essa mensalidade. O meu pagamento desse mês vai atrasar.',
    dataHora: '2026-05-16T10:15:00Z',
    statusEnvio: 'ENTREGUE'
  },
  {
    id: 'msg-3',
    alunoId: 'student-2',
    tipo: 'HUMANO_AGENTE',
    texto: 'Olá Ricardo! Sou o atendente financeiro do Instituto Sentidos. Conseguimos registrar um acordo com desconto para quitação. Vou te enviar os detalhes.',
    dataHora: '2026-05-16T10:32:00Z',
    statusEnvio: 'LIDO'
  },
  {
    id: 'msg-4',
    alunoId: 'student-2',
    tipo: 'HUMANO_CLIENTE',
    texto: 'Nossa, muito obrigado mesmo! Fico no aguardo então.',
    dataHora: '2026-05-16T11:01:00Z',
    statusEnvio: 'ENTREGUE'
  },
  {
    id: 'msg-5',
    alunoId: 'student-3',
    tipo: 'SISTEMA',
    texto: 'ALERTA DE INADIMPLÊNCIA: Camila Guimarães Rocha, identificamos parcelas em aberto referentes ao seu curso de Psicopedagogia. Evite restrições e regularize sua situação. Para negociar, responda 1️⃣.',
    dataHora: '2026-05-13T10:45:00Z',
    statusEnvio: 'ENTREGUE'
  }
];

export const INITIAL_COBRANCA_REGRAS: CobrancaRegra[] = [
  {
    id: 'rule-1',
    titulo: 'Lembrete Amigável (7 dias antes)',
    descricao: 'Envia um lembrete da parcela sete dias antes do vencimento.',
    diasGatilho: -7,
    tipoGatilho: 'ANTES',
    mensagemTemplate: 'Olá, {nome_aluno} 👋 Lembramos que a parcela {parcela} do curso {curso} no valor de {valor} vence em {vencimento}. Caso já tenha pago, desconsidere. Setor Financeiro Instituto Sentidos / FAEPI.',
    ativo: true,
    horarioEnvio: '09:00'
  },
  {
    id: 'rule-2',
    titulo: 'Reforço (3 dias antes)',
    descricao: 'Reforço de lembrete três dias antes do vencimento.',
    diasGatilho: -3,
    tipoGatilho: 'ANTES',
    mensagemTemplate: 'Olá, {nome_aluno}! Faltam poucos dias para o vencimento da parcela {parcela} ({valor}) em {vencimento}. Estamos à disposição para qualquer dúvida.',
    ativo: true,
    horarioEnvio: '09:00'
  },
  {
    id: 'rule-3',
    titulo: 'Aviso Final (1 dia antes)',
    descricao: 'Aviso final um dia antes do vencimento.',
    diasGatilho: -1,
    tipoGatilho: 'ANTES',
    mensagemTemplate: 'Atenção, {nome_aluno}: amanhã vence a parcela {parcela} do curso {curso} no valor de {valor} ({vencimento}). Caso já tenha efetuado o pagamento, desconsidere.',
    ativo: true,
    horarioEnvio: '08:30'
  },
  {
    id: 'rule-4',
    titulo: 'Aviso Leve (1 dia após)',
    descricao: 'Notifica o aluno um dia após o vencimento não identificado.',
    diasGatilho: 1,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'Olá, {nome_aluno}. Identificamos que a parcela {parcela} ({valor}), vencida em {vencimento}, ainda consta em aberto. Para regularizar responda 1️⃣ Negociar.',
    ativo: true,
    horarioEnvio: '09:30'
  },
  {
    id: 'rule-5',
    titulo: 'Cobrança Moderada (5 dias após)',
    descricao: 'Cobrança cinco dias após o vencimento.',
    diasGatilho: 5,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'Olá, {nome_aluno}. A parcela {parcela} ({valor}) está em atraso desde {vencimento}. Regularize para evitar acúmulo de pendências. Responda 1️⃣ Negociar ou 2️⃣ Atendimento Humano.',
    ativo: true,
    horarioEnvio: '09:30'
  },
  {
    id: 'rule-6',
    titulo: 'Negociação (15 dias após)',
    descricao: 'Oferece negociação após 15 dias de atraso.',
    diasGatilho: 15,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'COMUNICADO: {nome_aluno}, a parcela {parcela} ({valor}) do curso {curso} está com 15 dias de atraso. Temos condições especiais de negociação. Responda 1️⃣ Negociar.',
    ativo: true,
    horarioEnvio: '14:00'
  },
  {
    id: 'rule-7',
    titulo: 'Alerta Administrativo (30 dias após)',
    descricao: 'Alerta administrativo após 30 dias de atraso.',
    diasGatilho: 30,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'COMUNICADO IMPORTANTE: {nome_aluno}, a parcela {parcela} ({valor}) encontra-se com 30 dias de atraso. Solicitamos contato urgente para regularização e negociação.',
    ativo: false,
    horarioEnvio: '14:00'
  },
  {
    id: 'rule-8',
    titulo: 'Reforço Administrativo (45 dias após)',
    descricao: 'Reforço administrativo após 45 dias de atraso.',
    diasGatilho: 45,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'ATENÇÃO {nome_aluno}: a parcela {parcela} ({valor}) está com 45 dias de atraso. Entre em contato para negociar e evitar restrições acadêmicas.',
    ativo: false,
    horarioEnvio: '14:00'
  },
  {
    id: 'rule-9',
    titulo: 'Notificação Crítica (60 dias após)',
    descricao: 'Notificação crítica após 60 dias de atraso.',
    diasGatilho: 60,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'NOTIFICAÇÃO CRÍTICA: {nome_aluno}, a parcela {parcela} ({valor}) atingiu 60 dias de atraso. É imprescindível regularizar ou formalizar um acordo. Responda 2️⃣ Atendimento Humano.',
    ativo: false,
    horarioEnvio: '14:00'
  },
  {
    id: 'rule-10',
    titulo: 'Última Tentativa (90 dias após)',
    descricao: 'Última tentativa de cobrança após 90 dias de atraso.',
    diasGatilho: 90,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'ÚLTIMA TENTATIVA: {nome_aluno}, a parcela {parcela} ({valor}) está com 90 dias de atraso. Esta é a última notificação automática antes do encaminhamento administrativo.',
    ativo: false,
    horarioEnvio: '14:00'
  }
];

export const INITIAL_CRM_CONFIG: CrmConfig = {
  apiKey: 'lcc_live_732a1bb8f910403cd020839e0883fbb22019c0a',
  urlWebhook: 'https://services.leadconnectorhq.com/hooks/v2/sentidos-cobrancas-faepi',
  sincronizacaoAtiva: true,
  pipelines: [
    {
      id: 'pipe-1',
      nome: 'Sentidos - Captação & Recuperação Educacional',
      fases: [
        'Lead de Cobrança Criado',
        'Contato Inicial Efetuado',
        'Proposta de Negociação Enviada',
        'Acordo Realizado',
        'Perda / Aluno Desistente',
        'Sucesso / Pago'
      ]
    }
  ],
  tagMap: {
    pago: 'faepi-sentidos-pago',
    pendente: 'faepi-sentidos-cobrar',
    inadimplente: 'faepi-sentidos-inadimplente-critico'
  },
  logSincronizacao: [
    '2026-05-22 10:15:02 - Sincronização automática concluída: 12 alunos mapeados.',
    '2026-05-21 16:30:11 - Tag "faepi-sentidos-pago" aplicada para Mariana Silva Santos.',
    '2026-05-20 09:22:15 - Lead inserido na fase "Proposta de Negociação" para Ricardo Antunes de Moura.',
    '2026-05-19 11:00:44 - Integração LeadConnector: Enviado webhook para Diego Rodrigues de Aguiar.'
  ]
};

export const INITIAL_LOGS_ATIVIDADE: LogAtividade[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-22 15:10:22',
    tipo: 'WHATSAPP',
    usuario: 'Sistema de Automação',
    detalhe: 'Disparo de cobrança pré-vencimento realizado para Thiago Martins Fonseca (+55 (86) 99612-4422)',
    sucesso: true
  },
  {
    id: 'log-2',
    timestamp: '2026-05-22 12:00:44',
    tipo: 'IMPORTACAO',
    usuario: 'adm.financeiro',
    detalhe: 'Importação de matrículas financeiras via CSV. 142 alunos lidos, parcelas geradas automaticamente.',
    sucesso: true
  },
  {
    id: 'log-3',
    timestamp: '2026-05-22 09:15:12',
    tipo: 'CRM',
    usuario: 'Sistema de Automação',
    detalhe: 'Webhook enviado para LeadConnector atualizando o status do aluno Camila Guimarães Rocha para Inadimplente.',
    sucesso: true
  },
  {
    id: 'log-4',
    timestamp: '2026-05-21 18:22:31',
    tipo: 'USUARIO',
    usuario: 'adm.financeiro',
    detalhe: 'Template "Lembrete Amigável" atualizado com nova linha de agradecimento pelo WhatsApp.',
    sucesso: true
  },
  {
    id: 'log-5',
    timestamp: '2026-05-21 14:00:19',
    tipo: 'WHATSAPP',
    usuario: 'Atendente Humano',
    detalhe: 'Mudança de status para Atendimento Humano assumido no chat do aluno Ricardo de Moura.',
    sucesso: true
  }
];

export const INITIAL_USERS: Colaborador[] = [
  { id: 'usr-1', name: 'Ana Carolina Meireles', email: 'secretaria.sentidos@sentidos.edu.br', password: 'sentidos123', role: 'Secretaria', active: true },
  { id: 'usr-2', name: 'Francisco Santos Moura', email: 'financeiro.faepi@faepi.org', password: 'sentidos123', role: 'Financeiro', active: true },
  { id: 'usr-3', name: 'Rodrigo Lemos Ramos', email: 'r.lemos@sentidos.edu.br', password: 'sentidos123', role: 'Administrador', active: true },
  { id: 'usr-4', name: 'Admin Geral', email: 'isentidosedu@gmail.com', password: 'sentidos123', role: 'Administrador', active: true }
];
