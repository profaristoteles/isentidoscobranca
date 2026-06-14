export type StatusParcela = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'NEGOCIADO' | 'CANCELADO' | 'ISENTO';
export type OrigemParcela = 'MATRICULA' | 'IMPORTACAO_CSV' | 'NEGOCIACAO' | 'MANUAL';

export interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  matricula: string;
  curso: string;
  polo: string;
  whatsapp: string;
  email: string;
  statusFinanceiro: 'EM_DIA' | 'PENDENTE' | 'INADIMPLENTE';
  valorPendente: number;
  avatarUrl?: string;
  cadastroData: string;
  modalidade: 'Presencial' | 'Online';
  cobrancaAutomatica?: boolean;
  situacaoAcademica?: 'ATIVO' | 'CONCLUIDO' | 'EGRESSO_DEVEDOR'; // novo: situação do vínculo acadêmico

  // Matrícula financeira (contrato)
  turma?: string;
  valorMensalidade?: number;
  totalParcelas?: number;
  parcelasPagas?: number;
  primeiroVencimentoEmAberto?: string; // DD/MM/AAAA (pode ser data passada)
  diaVencimento?: number;
  dataMatriculaFinanceira?: string; // DD/MM/AAAA
  observacoes?: string;
}

export interface Parcela {
  id: string;
  alunoId: string;
  alunoNome: string;
  curso: string; // denormalizado do aluno
  turma: string;
  polo: string;
  numeroParcela: number; // 8
  totalParcelas: number; // 18 → exibe "08/18"
  competencia: string; // "06/2026"
  vencimento: string; // "10/06/2026"
  valorOriginal: number; // nunca muda
  valorAtual: number; // = valorOriginal até negociação
  status: StatusParcela;
  origem: OrigemParcela;
  dataPagamento?: string;
  observacoes?: string;
  enviadoWhatsAppCount: number;
  ultimoEnvio?: string;
  criadoEm: string; // ISO
  atualizadoEm: string; // ISO
}

export interface ParcelaHistorico {
  id: string;
  parcelaId: string;
  alunoId: string;
  data: string; // ISO
  acao: string; // "Parcela criada", "Cobrança enviada", "Status alterado para NEGOCIADO"...
  observacao?: string;
  usuario?: string;
}

export interface WhatsAppMensagem {
  id: string;
  alunoId: string;
  tipo: 'SISTEMA' | 'HUMANO_CLIENTE' | 'HUMANO_AGENTE';
  texto: string;
  dataHora: string;
  statusEnvio: 'ENVIADO' | 'ENTREGUE' | 'LIDO' | 'FALHA';
}

export interface CobrancaRegra {
  id: string;
  titulo: string;
  descricao: string;
  diasGatilho: number; // dias em relação ao vencimento (negativo = antes, positivo = depois)
  tipoGatilho: 'ANTES' | 'DIA_VENCIMENTO' | 'DEPOIS';
  mensagemTemplate: string;
  ativo: boolean;
  horarioEnvio: string;
  canal?: 'WHATSAPP' | 'EMAIL' | 'AMBOS';
  destinatario?: 'ALUNO' | 'EQUIPE_INTERNA';
}

export interface CrmConfig {
  apiKey: string;
  urlWebhook: string;
  sincronizacaoAtiva: boolean;
  logSincronizacao: string[];
  pipelines: {
    id: string;
    nome: string;
    fases: string[];
  }[];
  tagMap: {
    pago: string;
    pendente: string;
    inadimplente: string;
  };
}

export interface LogAtividade {
  id: string;
  timestamp: string;
  tipo: 'SISTEMA' | 'WHATSAPP' | 'CRM' | 'IMPORTACAO' | 'USUARIO';
  usuario?: string;
  detalhe: string;
  sucesso: boolean;
}

export interface Colaborador {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Administrador' | 'Financeiro' | 'Secretaria';
  active: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
  active: boolean;
}

export interface ScheduledDispatch {
  enabled: boolean;
  horario: string;           // "09:00" — hora do disparo (horário de Brasília)
  diasSemana: number[];      // 0=Dom, 1=Seg … 6=Sáb
  ultimoDisparo?: string;    // ISO timestamp do último disparo executado
  ultimoResultado?: string;  // descrição do resultado do último disparo
}

export interface EvolutionConfig {
  url: string;
  instanceName: string;
  instanceToken: string;
  globalToken: string;
}

export interface GlobalSettings {
  teamPhoneNumber: string;
  dispatchMinIntervalSec: number;
  dispatchMaxIntervalSec: number;
  scheduledDispatch?: ScheduledDispatch;
  evolutionConfig?: EvolutionConfig;
}

