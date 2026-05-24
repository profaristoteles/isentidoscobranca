import { Aluno, Boleto, WhatsAppMensagem, CobrancaRegra, CrmConfig, LogAtividade } from './types';

export const INITIAL_POLOS: string[] = ['Teresina (Sede)', 'Parnaíba', 'Floriano', 'Picos'];

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
    modalidade: 'Presencial'
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
    valorPendente: 380.00,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    cadastroData: '2024-08-10',
    modalidade: 'Online'
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
    valorPendente: 1140.00,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    cadastroData: '2025-01-11',
    modalidade: 'Presencial'
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
    modalidade: 'Presencial'
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
    valorPendente: 760.00,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    cadastroData: '2024-05-18',
    modalidade: 'Online'
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
    modalidade: 'Presencial'
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
    valorPendente: 420.00,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    cadastroData: '2024-09-02',
    modalidade: 'Online'
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
    modalidade: 'Presencial'
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
    valorPendente: 1450.00,
    avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150',
    cadastroData: '2025-02-15',
    modalidade: 'Online'
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
    modalidade: 'Presencial'
  }
];;

export const INITIAL_BOLETOS: Boleto[] = [
  {
    id: 'bil-150',
    alunoId: 'student-1',
    alunoNome: 'Mariana Silva Santos',
    competencia: '05/2026',
    vencimento: '10/05/2026',
    valor: 450.00,
    status: 'PAGO',
    linhaDigitavel: '00190.00009 02738.162006 12345.678901 8 99830000045000',
    nossoNumero: '25/0842231-9',
    pdfUrl: '#',
    enviadoWhatsAppCount: 2,
    ultimoEnvio: '05/05/2026 10:15'
  },
  {
    id: 'bil-151',
    alunoId: 'student-1',
    alunoNome: 'Mariana Silva Santos',
    competencia: '06/2026',
    vencimento: '10/06/2026',
    valor: 450.00,
    status: 'ABERTO',
    linhaDigitavel: '00190.00009 02738.162006 12345.678901 8 99830000045000',
    nossoNumero: '25/0842240-2',
    pdfUrl: '#',
    enviadoWhatsAppCount: 0
  },
  {
    id: 'bil-152',
    alunoId: 'student-2',
    alunoNome: 'Ricardo Antunes de Moura',
    competencia: '04/2026',
    vencimento: '15/04/2026',
    valor: 380.00,
    status: 'ABERTO',
    linhaDigitavel: '10490.12304 56780.221144 00012.339103 2 99120000038000',
    nossoNumero: '10/0034a11-0',
    pdfUrl: '#',
    enviadoWhatsAppCount: 4,
    ultimoEnvio: '18/04/2026 14:30'
  },
  {
    id: 'bil-153',
    alunoId: 'student-2',
    alunoNome: 'Ricardo Antunes de Moura',
    competencia: '05/2026',
    vencimento: '15/05/2026',
    valor: 380.00,
    status: 'ABERTO',
    linhaDigitavel: '10490.12304 56780.221144 00012.339115 2 99120000038000',
    nossoNumero: '10/0034a12-8',
    pdfUrl: '#',
    enviadoWhatsAppCount: 1,
    ultimoEnvio: '10/05/2026 09:00'
  } as unknown as Boleto, // force compatible
  {
    id: 'bil-154',
    alunoId: 'student-3',
    alunoNome: 'Camila Guimarães Rocha',
    competencia: '03/2026',
    vencimento: '12/03/2026',
    valor: 380.00,
    status: 'VENCIDO',
    linhaDigitavel: '34190.12345 67890.123456 12345.678907 1 99010000038000',
    nossoNumero: '09/4423190-2',
    pdfUrl: '#',
    enviadoWhatsAppCount: 5,
    ultimoEnvio: '20/03/2026 16:22'
  },
  {
    id: 'bil-155',
    alunoId: 'student-3',
    alunoNome: 'Camila Guimarães Rocha',
    competencia: '04/2026',
    vencimento: '12/04/2026',
    valor: 380.00,
    status: 'VENCIDO',
    linhaDigitavel: '34190.12345 67890.123456 12345.678908 1 99010000038000',
    nossoNumero: '09/4423211-1',
    pdfUrl: '#',
    enviadoWhatsAppCount: 3,
    ultimoEnvio: '15/04/2026 09:12'
  },
  {
    id: 'bil-156',
    alunoId: 'student-3',
    alunoNome: 'Camila Guimarães Rocha',
    competencia: '05/2026',
    vencimento: '12/05/2026',
    valor: 380.00,
    status: 'VENCIDO',
    linhaDigitavel: '34190.12345 67890.123456 12345.678909 1 99010000038000',
    nossoNumero: '09/4423240-5',
    pdfUrl: '#',
    enviadoWhatsAppCount: 2,
    ultimoEnvio: '13/05/2026 10:45'
  },
  {
    id: 'bil-157',
    alunoId: 'student-4',
    alunoNome: 'Bernardo Souza Nogueira',
    competencia: '04/2026',
    vencimento: '22/04/2026',
    valor: 290.00,
    status: 'PAGO',
    linhaDigitavel: '10490.12304 56780.221144 00012.339592 2 99120000029000',
    nossoNumero: '10/0122390-1',
    pdfUrl: '#',
    enviadoWhatsAppCount: 1,
    ultimoEnvio: '18/04/2026 08:30'
  },
  {
    id: 'bil-158',
    alunoId: 'student-4',
    alunoNome: 'Bernardo Souza Nogueira',
    competencia: '05/2026',
    vencimento: '22/05/2026',
    valor: 290.00,
    status: 'PAGO',
    linhaDigitavel: '10490.12304 56780.221144 00012.339611 2 99120000029000',
    nossoNumero: '10/0122412-2',
    pdfUrl: '#',
    enviadoWhatsAppCount: 1,
    ultimoEnvio: '18/05/2026 08:30'
  },
  {
    id: 'bil-159',
    alunoId: 'student-5',
    alunoNome: 'Fernanda Lima Oliveira',
    competencia: '04/2026',
    vencimento: '10/04/2026',
    valor: 380.00,
    status: 'VENCIDO',
    linhaDigitavel: '00190.00009 02738.162006 12345.673909 8 99830000038000',
    nossoNumero: '25/0842911-3',
    pdfUrl: '#',
    enviadoWhatsAppCount: 4,
    ultimoEnvio: '12/04/2026 15:40'
  },
  {
    id: 'bil-160',
    alunoId: 'student-5',
    alunoNome: 'Fernanda Lima Oliveira',
    competencia: '05/2026',
    vencimento: '10/05/2026',
    valor: 380.00,
    status: 'VENCIDO',
    linhaDigitavel: '00190.00009 02738.162006 12345.673922 8 99830000038000',
    nossoNumero: '25/0842940-7',
    pdfUrl: '#',
    enviadoWhatsAppCount: 3,
    ultimoEnvio: '11/05/2026 11:32'
  },
  {
    id: 'bil-161',
    alunoId: 'student-7',
    alunoNome: 'Ana Beatryz Fernandes',
    competencia: '05/2026',
    vencimento: '22/05/2026',
    valor: 420.00,
    status: 'ABERTO',
    linhaDigitavel: '10490.12304 56780.221144 00012.339611 2 99120000042000',
    nossoNumero: '10/0122904-5',
    pdfUrl: '#',
    enviadoWhatsAppCount: 1,
    ultimoEnvio: '18/05/2026 09:20'
  },
  {
    id: 'bil-162',
    alunoId: 'student-9',
    alunoNome: 'Letícia Guedes Cavalcante',
    competencia: '03/2026',
    vencimento: '05/03/2026',
    valor: 480.00,
    status: 'VENCIDO',
    linhaDigitavel: '34190.12345 67890.123456 12345.678907 1 99010000048000',
    nossoNumero: '09/4423190-2',
    pdfUrl: '#',
    enviadoWhatsAppCount: 6,
    ultimoEnvio: '10/03/2026 09:15'
  },
  {
    id: 'bil-163',
    alunoId: 'student-9',
    alunoNome: 'Letícia Guedes Cavalcante',
    competencia: '04/2026',
    vencimento: '05/04/2026',
    valor: 480.00,
    status: 'VENCIDO',
    linhaDigitavel: '34190.12345 67890.123456 12345.678907 1 99010000048000',
    nossoNumero: '09/4423190-3',
    pdfUrl: '#',
    enviadoWhatsAppCount: 4,
    ultimoEnvio: '10/04/2026 09:30'
  },
  {
    id: 'bil-164',
    alunoId: 'student-9',
    alunoNome: 'Letícia Guedes Cavalcante',
    competencia: '05/2026',
    vencimento: '05/05/2026',
    valor: 490.00,
    status: 'VENCIDO',
    linhaDigitavel: '34190.12345 67890.123456 12345.678907 1 99010000049000',
    nossoNumero: '09/4423190-4',
    pdfUrl: '#',
    enviadoWhatsAppCount: 2,
    ultimoEnvio: '07/05/2026 14:15'
  },
  {
    id: 'bil-165',
    alunoId: 'student-10',
    alunoNome: 'Thiago Martins Fonseca',
    competencia: '05/2026',
    vencimento: '25/05/2026',
    valor: 380.00,
    status: 'PAGO',
    linhaDigitavel: '00190.00009 02738.162006 12345.673922 8 99830000038000',
    nossoNumero: '25/0842991-0',
    pdfUrl: '#',
    enviadoWhatsAppCount: 1,
    ultimoEnvio: '20/05/2026 11:20'
  }
];

export const INITIAL_WHATSAPP_MENSAGENS: WhatsAppMensagem[] = [
  {
    id: 'msg-1',
    alunoId: 'student-2',
    tipo: 'SISTEMA',
    texto: 'Olá Ricardo Antunes de Moura! Lembramos que o seu boleto de Pós-Graduação com vencimento em 15/05/2026 no valor de R$ 380,00 já está disponível para pagamento. Linha Digitável: 10490.12304 56780.221144 00012.339115 2 99120000038000. Evite juros!',
    dataHora: '2026-05-10T09:00:00Z',
    statusEnvio: 'LIDO'
  },
  {
    id: 'msg-2',
    alunoId: 'student-2',
    tipo: 'HUMANO_CLIENTE',
    texto: 'Bom dia! Gostaria de pedir se há possibilidade de adiar o vencimento deste boleto de maio para o dia 25. O meu pagamento desse mês vai atrasar.',
    dataHora: '2026-05-10T10:15:00Z',
    statusEnvio: 'ENTREGUE'
  },
  {
    id: 'msg-3',
    alunoId: 'student-2',
    tipo: 'HUMANO_AGENTE',
    texto: 'Olá Ricardo! Sou o atendente financeiro do Instituto Sentidos. Verifiquei aqui no sistema. Podemos prorrogar até o dia 25 sem aplicação de juros contratuais, como cortesia para você.',
    dataHora: '2026-05-10T10:32:00Z',
    statusEnvio: 'LIDO'
  },
  {
    id: 'msg-4',
    alunoId: 'student-2',
    tipo: 'HUMANO_CLIENTE',
    texto: 'Nossa, muito obrigado mesmo! Fico no aguardo do novo boleto então.',
    dataHora: '2026-05-10T11:01:00Z',
    statusEnvio: 'ENTREGUE'
  },
  {
    id: 'msg-5',
    alunoId: 'student-3',
    tipo: 'SISTEMA',
    texto: 'ALERTA DE INADIMPLÊNCIA: Camila Guimarães Rocha, identificamos pendências financeiras em seu cadastro de Pós-Graduação referente aos meses 03/2026, 04/2026 e 05/2026 no valor total acumulado de R$ 1.140,00. Evite o bloqueio temporário de acesso ao portal do aluno. Regularize em sentidos.edu.br/financeiro.',
    dataHora: '2026-05-13T10:45:00Z',
    statusEnvio: 'ENTREGUE'
  }
];

export const INITIAL_COBRANCA_REGRAS: CobrancaRegra[] = [
  {
    id: 'rule-1',
    titulo: 'Lembrete Amigável (Pré-vencimento)',
    descricao: 'Envia um lembrete com a linha digitável e PDF cinco dias antes de o boleto vencer.',
    diasGatilho: -5,
    tipoGatilho: 'ANTES',
    mensagemTemplate: 'Olá, {nome_aluno}! Lembramos que o seu boleto de {curso} no valor de {valor_boleto} vence em {vencimento_boleto}. Você pode efetuar o pagamento lendo a linha digitável: {linha_digitavel}. Atenciosamente, Setor Financeiro Instituto Sentidos / FAEPI.',
    ativo: true,
    horarioEnvio: '09:00'
  },
  {
    id: 'rule-2',
    titulo: 'Notificação do Dia de Vencimento',
    descricao: 'Dispara no dia exato do vencimento do boleto no início da manhã.',
    diasGatilho: 0,
    tipoGatilho: 'DIA_VENCIMENTO',
    mensagemTemplate: 'Atenção, {nome_aluno}: Hoje é o dia de vencimento da mensalidade de {curso} (Competência {competencia}) no valor de {valor_boleto}. Acesse seu PDF no link: {link_pdf} ou utilize o código: {linha_digitavel}. Caso já tenha pago, por favor desconsidere.',
    ativo: true,
    horarioEnvio: '08:30'
  },
  {
    id: 'rule-3',
    titulo: 'Aviso Imediato de Atraso',
    descricao: 'Notifica o aluno um dia útil após o vencimento não identificado.',
    diasGatilho: 1,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'Olá, {nome_aluno}. Identificamos que o boleto de {curso} no valor de {valor_boleto}, vencido em {vencimento_boleto}, ainda consta em aberto no nosso banco de dados. Para pagar sem multas elevadas, utilize este código atualizado hoje: {linha_digitavel}. Evite restrições!',
    ativo: true,
    horarioEnvio: '09:30'
  },
  {
    id: 'rule-4',
    titulo: 'Notificação de Inadimplência Crítica',
    descricao: 'Disparada após 15 dias de atraso. Alerta sobre restrição acadêmica e cadastral.',
    diasGatilho: 15,
    tipoGatilho: 'DEPOIS',
    mensagemTemplate: 'COMUNICADO IMPORTANTE: {nome_aluno}, seu cadastro de estudante para o curso {curso} apresenta pendência financeira grave de 15 dias no valor de {valor_boleto}. Solicitamos contato urgente no telefone (86) 3211-0012 para negociarmos sua pendência com condições facilitadas e evitar a suspensão de novos módulos.',
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
        'Acordo Realizado / Aguardando Boleto',
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
    detalhe: 'Importação de lote de boletos bancários da FAEPI. 142 registros lidos, 0 erros.',
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
