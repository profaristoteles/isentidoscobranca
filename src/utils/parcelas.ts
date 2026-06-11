import { Aluno, Parcela, ParcelaHistorico, StatusParcela, OrigemParcela } from '../types';
import { parseVencimento, formatDateBR, isVencido } from './dateHelpers';

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Returns a new Date `months` ahead of `base`, fixing the day-of-month to `dia`
 * (clamped to the target month's last day). Accepts past base dates.
 */
export function addMonthsKeepDay(base: Date, months: number, dia: number): Date {
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(dia, lastDay));
  return target;
}

/** "08/18" */
export function formatParcela(p: Parcela): string {
  const n = String(p.numeroParcela).padStart(2, '0');
  const t = String(p.totalParcelas).padStart(2, '0');
  return `${n}/${t}`;
}

/**
 * Effective status only ever flips between PENDENTE and ATRASADO based on the
 * due date. Final statuses (PAGO/NEGOCIADO/CANCELADO/ISENTO) are never touched.
 */
export function getStatusEfetivo(p: Pick<Parcela, 'status' | 'vencimento'>): StatusParcela {
  if (p.status === 'PENDENTE' || p.status === 'ATRASADO') {
    return isVencido(p.vencimento) ? 'ATRASADO' : 'PENDENTE';
  }
  return p.status;
}

/** A régua só dispara para parcelas em aberto. */
export function podeReceberCobranca(p: Parcela): boolean {
  return p.status === 'PENDENTE' || p.status === 'ATRASADO';
}

/** Duplicidade lógica: mesmo aluno + mesmo número de parcela. */
export function parcelaJaExiste(parcelas: Parcela[], alunoId: string, numero: number): boolean {
  return parcelas.some(p => p.alunoId === alunoId && p.numeroParcela === numero);
}

/** Factory de entrada de auditoria. */
export function novoHistorico(
  parcelaId: string,
  alunoId: string,
  acao: string,
  observacao?: string,
  usuario?: string
): ParcelaHistorico {
  return {
    id: uid('hist'),
    parcelaId,
    alunoId,
    data: new Date().toISOString(),
    acao,
    observacao,
    usuario
  };
}

/**
 * Gera somente as parcelas ainda não pagas de uma matrícula financeira.
 * `restantes = totalParcelas - parcelasPagas`; a 1ª usa primeiroVencimentoEmAberto
 * (pode estar no passado) e as seguintes avançam um mês cada.
 * Pula números de parcela já existentes para o aluno (anti-duplicidade).
 */
export function generateParcelas(
  aluno: Aluno,
  existentes: Parcela[] = [],
  origem: OrigemParcela = 'MATRICULA'
): Parcela[] {
  const total = Number(aluno.totalParcelas) || 0;
  const pagas = Number(aluno.parcelasPagas) || 0;
  const valor = Number(aluno.valorMensalidade) || 0;
  const dia = Number(aluno.diaVencimento) || 1;
  const base = parseVencimento(aluno.primeiroVencimentoEmAberto || '');

  if (!base || total <= 0 || total - pagas <= 0) return [];

  const restantes = total - pagas;
  const nowIso = new Date().toISOString();
  const novas: Parcela[] = [];

  for (let i = 0; i < restantes; i++) {
    const numero = pagas + 1 + i;
    if (parcelaJaExiste(existentes, aluno.id, numero)) continue;

    const dataVenc = addMonthsKeepDay(base, i, dia);
    const vencimento = formatDateBR(dataVenc);
    const competencia = `${String(dataVenc.getMonth() + 1).padStart(2, '0')}/${dataVenc.getFullYear()}`;

    const parcela: Parcela = {
      id: uid('parc'),
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      curso: aluno.curso,
      turma: aluno.turma || '',
      polo: aluno.polo,
      numeroParcela: numero,
      totalParcelas: total,
      competencia,
      vencimento,
      valorOriginal: valor,
      valorAtual: valor,
      status: 'PENDENTE',
      origem,
      enviadoWhatsAppCount: 0,
      criadoEm: nowIso,
      atualizadoEm: nowIso
    };
    // Marca já como ATRASADO se a 1ª data em aberto está no passado.
    parcela.status = getStatusEfetivo(parcela);
    novas.push(parcela);
  }

  return novas;
}
