export type StatusFinanceiro = 'PAGO' | 'ABERTO' | 'VENCIDO' | 'NEGOCIADO';

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
}

export interface Boleto {
  id: string;
  alunoId: string;
  alunoNome: string;
  competencia: string;
  vencimento: string;
  valor: number;
  status: StatusFinanceiro;
  linhaDigitavel: string;
  nossoNumero: string;
  pdfUrl: string;
  enviadoWhatsAppCount: number;
  ultimoEnvio?: string;
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

