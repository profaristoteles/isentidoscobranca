import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  INITIAL_ALUNOS,
  INITIAL_PARCELAS,
  INITIAL_PARCELA_HISTORICO,
  INITIAL_WHATSAPP_MENSAGENS,
  INITIAL_COBRANCA_REGRAS,
  INITIAL_CRM_CONFIG,
  INITIAL_LOGS_ATIVIDADE,
  INITIAL_POLOS,
  INITIAL_USERS,
  INITIAL_CURSOS
} from './src/mockData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');
const BACKUP_PATH = path.join(__dirname, 'database.boletos.backup.json');

export interface DbData {
  alunos: any[];
  parcelas: any[];
  parcelaHistorico: any[];
  mensagens: any[];
  regras: any[];
  crmConfig: any;
  logs: any[];
  polos: string[];
  cursos: string[];
  users: any[];
  smtpConfig?: any;
  globalSettings?: any;
}

export function getInitialData(): DbData {
  return {
    alunos: INITIAL_ALUNOS,
    parcelas: INITIAL_PARCELAS,
    parcelaHistorico: INITIAL_PARCELA_HISTORICO,
    mensagens: INITIAL_WHATSAPP_MENSAGENS,
    regras: INITIAL_COBRANCA_REGRAS,
    crmConfig: INITIAL_CRM_CONFIG,
    logs: INITIAL_LOGS_ATIVIDADE,
    polos: INITIAL_POLOS,
    cursos: INITIAL_CURSOS,
    users: INITIAL_USERS,
    smtpConfig: {
      host: 'smtp.zeptomail.com',
      port: 587,
      user: 'emailapikey',
      pass: '',
      fromEmail: '',
      fromName: 'Instituto Sentidos',
      secure: false,
      active: false
    },
    globalSettings: {
      teamPhoneNumber: ''
    }
  };
}

/**
 * Grava (e valida) um backup do database.json atual antes de qualquer operação
 * destrutiva. Retorna true se o backup foi gravado e relido com sucesso, ou se
 * não há database.json a proteger (nada a perder). Retorna false se a gravação
 * falhar — nesse caso a operação chamadora deve abortar.
 */
export function backupDatabaseFile(): boolean {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Nada a proteger ainda.
      return true;
    }
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    fs.writeFileSync(BACKUP_PATH, content, 'utf-8');
    // Valida: relê o backup e confere o tamanho.
    const check = fs.readFileSync(BACKUP_PATH, 'utf-8');
    if (check.length !== content.length) {
      console.error('[Database] Backup gravado com tamanho divergente. Abortando operação.');
      return false;
    }
    console.log(`[Database] Backup de segurança gravado em ${BACKUP_PATH}`);
    return true;
  } catch (error) {
    console.error('[Database] Falha ao gravar backup de segurança:', error);
    return false;
  }
}

let pool: pg.Pool | null = null;
const usePg = !!process.env.DATABASE_URL;

if (usePg) {
  console.log('[Database] PostgreSQL URL configurada. Inicializando conexão...');
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined
  });
} else {
  console.log('[Database] PostgreSQL não configurado (DATABASE_URL ausente). Utilizando modo de arquivo JSON (database.json).');
}

// Converte boletos legados em parcelas, preservando o histórico financeiro.
function convertBoletosToParcelas(boletos: any[], alunos: any[]): any[] {
  if (!Array.isArray(boletos) || boletos.length === 0) return [];

  const statusMap: Record<string, string> = {
    ABERTO: 'PENDENTE',
    VENCIDO: 'ATRASADO',
    PAGO: 'PAGO',
    NEGOCIADO: 'NEGOCIADO'
  };

  // Agrupa por aluno para numerar as parcelas.
  const porAluno: Record<string, any[]> = {};
  for (const b of boletos) {
    (porAluno[b.alunoId] = porAluno[b.alunoId] || []).push(b);
  }

  const nowIso = new Date().toISOString();
  const parcelas: any[] = [];

  for (const alunoId of Object.keys(porAluno)) {
    const grupo = porAluno[alunoId].slice().sort((x, y) =>
      String(x.vencimento).split('/').reverse().join('').localeCompare(String(y.vencimento).split('/').reverse().join(''))
    );
    const aluno = alunos.find(a => a.id === alunoId);
    const total = grupo.length;
    grupo.forEach((b, idx) => {
      const valor = Number(b.valor) || 0;
      parcelas.push({
        id: b.id,
        alunoId: b.alunoId,
        alunoNome: b.alunoNome,
        curso: aluno?.curso || '',
        turma: aluno?.turma || '',
        polo: aluno?.polo || '',
        numeroParcela: idx + 1,
        totalParcelas: total,
        competencia: b.competencia || '',
        vencimento: b.vencimento || '',
        valorOriginal: valor,
        valorAtual: valor,
        status: statusMap[b.status] || 'PENDENTE',
        origem: 'IMPORTACAO_CSV',
        dataPagamento: b.status === 'PAGO' ? b.vencimento : undefined,
        enviadoWhatsAppCount: b.enviadoWhatsAppCount || 0,
        ultimoEnvio: b.ultimoEnvio,
        criadoEm: nowIso,
        atualizadoEm: nowIso
      });
    });
  }

  return parcelas;
}

// JSON Fallback read helper
function readDBJson(): DbData {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDBJson(getInitialData());
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);

    let updated = false;
    if (!parsed.polos) {
      parsed.polos = INITIAL_POLOS;
      updated = true;
    }
    if (!parsed.cursos) {
      parsed.cursos = INITIAL_CURSOS;
      updated = true;
    }
    if (!parsed.users) {
      parsed.users = INITIAL_USERS;
      updated = true;
    }
    if (!parsed.smtpConfig) {
      parsed.smtpConfig = {
        host: 'smtp.zeptomail.com',
        port: 587,
        user: 'emailapikey',
        pass: '',
        fromEmail: '',
        fromName: 'Instituto Sentidos',
        secure: false,
        active: false
      };
      updated = true;
    }
    if (!parsed.globalSettings) {
      parsed.globalSettings = {
        teamPhoneNumber: ''
      };
      updated = true;
    }
    if (!parsed.parcelaHistorico) {
      parsed.parcelaHistorico = [];
      updated = true;
    }
    if (parsed.alunos && Array.isArray(parsed.alunos)) {
      parsed.alunos = parsed.alunos.map((a: any) => {
        if (!a.modalidade) {
          a.modalidade = 'Presencial';
          updated = true;
        }
        return a;
      });
    }

    // Migração segura boletos → parcelas (com backup obrigatório).
    if (parsed.boletos && !parsed.parcelas) {
      if (backupDatabaseFile()) {
        parsed.parcelas = convertBoletosToParcelas(parsed.boletos, parsed.alunos || []);
        console.log(`[Database] Migração boletos→parcelas concluída: ${parsed.parcelas.length} parcelas. Boletos preservados no backup.`);
        updated = true;
      } else {
        console.error('[Database] Backup falhou — conversão de boletos abortada. Mantendo dados originais intactos.');
        parsed.parcelas = [];
      }
    }
    if (!parsed.parcelas) {
      parsed.parcelas = [];
      updated = true;
    }

    if (updated) {
      writeDBJson(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('[Database] Erro ao ler arquivo database.json:', error);
    return getInitialData();
  }
}

// JSON Fallback write helper
function writeDBJson(data: DbData) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Database] Erro ao escrever arquivo database.json:', error);
  }
}

// Initialize Database Schema and Data Migration
export async function initDb(): Promise<void> {
  if (!usePg || !pool) {
    if (!fs.existsSync(DB_PATH)) {
      writeDBJson(getInitialData());
    } else {
      // Garante migração/normalização na primeira leitura.
      readDBJson();
    }
    return;
  }

  try {
    console.log('[Database] Criando tabelas no PostgreSQL caso não existam...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS polos (
        nome VARCHAR(255) PRIMARY KEY
      );
 
      CREATE TABLE IF NOT EXISTS cursos (
        nome VARCHAR(255) PRIMARY KEY
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS alunos (
        id VARCHAR(100) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cpf VARCHAR(50) NOT NULL,
        matricula VARCHAR(50) NOT NULL,
        curso VARCHAR(255) NOT NULL,
        polo VARCHAR(100) NOT NULL,
        whatsapp VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        "statusFinanceiro" VARCHAR(50) NOT NULL,
        "valorPendente" NUMERIC(12, 2) NOT NULL,
        "avatarUrl" VARCHAR(500),
        "cadastroData" VARCHAR(50) NOT NULL,
        modalidade VARCHAR(50) NOT NULL,
        "cobrancaAutomatica" BOOLEAN DEFAULT TRUE
      );

      ALTER TABLE alunos ADD COLUMN IF NOT EXISTS turma VARCHAR(100);
      ALTER TABLE alunos ADD COLUMN IF NOT EXISTS "valorMensalidade" NUMERIC(12, 2);
      ALTER TABLE alunos ADD COLUMN IF NOT EXISTS "totalParcelas" INTEGER;
      ALTER TABLE alunos ADD COLUMN IF NOT EXISTS "parcelasPagas" INTEGER;
      ALTER TABLE alunos ADD COLUMN IF NOT EXISTS "primeiroVencimentoEmAberto" VARCHAR(50);
      ALTER TABLE alunos ADD COLUMN IF NOT EXISTS "diaVencimento" INTEGER;
      ALTER TABLE alunos ADD COLUMN IF NOT EXISTS "dataMatriculaFinanceira" VARCHAR(50);
      ALTER TABLE alunos ADD COLUMN IF NOT EXISTS observacoes TEXT;

      CREATE TABLE IF NOT EXISTS parcelas (
        id VARCHAR(100) PRIMARY KEY,
        "alunoId" VARCHAR(100) NOT NULL,
        "alunoNome" VARCHAR(255) NOT NULL,
        curso VARCHAR(255),
        turma VARCHAR(100),
        polo VARCHAR(100),
        "numeroParcela" INTEGER NOT NULL,
        "totalParcelas" INTEGER NOT NULL,
        competencia VARCHAR(50) NOT NULL,
        vencimento VARCHAR(50) NOT NULL,
        "valorOriginal" NUMERIC(12, 2) NOT NULL,
        "valorAtual" NUMERIC(12, 2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        origem VARCHAR(50) NOT NULL,
        "dataPagamento" VARCHAR(50),
        observacoes TEXT,
        "enviadoWhatsAppCount" INTEGER DEFAULT 0,
        "ultimoEnvio" VARCHAR(50),
        "criadoEm" VARCHAR(50),
        "atualizadoEm" VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS parcela_historico (
        id VARCHAR(100) PRIMARY KEY,
        "parcelaId" VARCHAR(100) NOT NULL,
        "alunoId" VARCHAR(100) NOT NULL,
        data VARCHAR(50) NOT NULL,
        acao VARCHAR(255) NOT NULL,
        observacao TEXT,
        usuario VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS mensagens (
        id VARCHAR(100) PRIMARY KEY,
        "alunoId" VARCHAR(100) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        texto TEXT NOT NULL,
        "dataHora" VARCHAR(50) NOT NULL,
        "statusEnvio" VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS regras (
        id VARCHAR(100) PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        "diasGatilho" INTEGER NOT NULL,
        "tipoGatilho" VARCHAR(50) NOT NULL,
        "mensagemTemplate" TEXT NOT NULL,
        ativo BOOLEAN DEFAULT TRUE,
        "horarioEnvio" VARCHAR(10) NOT NULL,
        canal VARCHAR(50) DEFAULT 'WHATSAPP',
        destinatario VARCHAR(50) DEFAULT 'ALUNO'
      );

      ALTER TABLE regras ADD COLUMN IF NOT EXISTS canal VARCHAR(50) DEFAULT 'WHATSAPP';
      ALTER TABLE regras ADD COLUMN IF NOT EXISTS destinatario VARCHAR(50) DEFAULT 'ALUNO';

      CREATE TABLE IF NOT EXISTS crm_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        "apiKey" VARCHAR(255),
        "urlWebhook" VARCHAR(255),
        "sincronizacaoAtiva" BOOLEAN DEFAULT TRUE,
        "logSincronizacao" JSONB DEFAULT '[]'::jsonb,
        pipelines JSONB DEFAULT '[]'::jsonb,
        "tagMap" JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS smtp_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        host VARCHAR(255) DEFAULT 'smtp.zeptomail.com',
        port INTEGER DEFAULT 587,
        username VARCHAR(255) DEFAULT 'emailapikey',
        password TEXT DEFAULT '',
        "fromEmail" VARCHAR(255) DEFAULT '',
        "fromName" VARCHAR(255) DEFAULT 'Instituto Sentidos',
        secure BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS global_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        "teamPhoneNumber" VARCHAR(100) DEFAULT ''
      );

      -- Garante a existência do registro padrão id=1
      INSERT INTO smtp_config (id)
      SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM smtp_config WHERE id = 1);

      INSERT INTO global_settings (id)
      SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM global_settings WHERE id = 1);

      INSERT INTO crm_config (id)
      SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM crm_config WHERE id = 1);
    `);

    // Check if database already has users/data
    const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCountRes.rows[0].count, 10);

    if (userCount === 0) {
      if (fs.existsSync(DB_PATH)) {
        console.log('[Database] Banco PostgreSQL vazio, mas database.json detectado. Iniciando migração automática...');
        try {
          const localData = readDBJson();
          if ((localData as any).migrated) {
            console.log('[Database] O arquivo database.json existente já foi migrado anteriormente. Ignorando e semeando dados iniciais...');
            await writeDB(getInitialData());
          } else {
            await writeDB(localData);
            console.log('[Database] Migração automática realizada com sucesso!');
            writeDBJson({ migrated: true } as any);
            console.log(`[Database] database.json marcado com {"migrated": true} para evitar migrações futuras.`);
          }
        } catch (migrationErr) {
          console.error('[Database] Falha ao realizar migração. Aplicando seed de dados inicial...', migrationErr);
          await writeDB(getInitialData());
        }
      } else {
        console.log('[Database] Banco PostgreSQL vazio. Inicializando com dados iniciais...');
        await writeDB(getInitialData());
      }
    } else {
      console.log('[Database] Tabelas do PostgreSQL prontas e populadas.');
    }
  } catch (error) {
    console.error('[Database] Falha ao inicializar o banco de dados PostgreSQL:', error);
    throw error;
  }
}

// Read database
export async function readDB(): Promise<DbData> {
  if (!usePg || !pool) {
    return readDBJson();
  }

  try {
    const [
      alunosRes,
      parcelasRes,
      historicoRes,
      mensagensRes,
      regrasRes,
      crmRes,
      logsRes,
      polosRes,
      cursosRes,
      usersRes,
      smtpRes,
      globalRes
    ] = await Promise.all([
      pool.query('SELECT * FROM alunos ORDER BY nome ASC'),
      pool.query('SELECT * FROM parcelas ORDER BY vencimento DESC'),
      pool.query('SELECT * FROM parcela_historico ORDER BY data DESC'),
      pool.query('SELECT * FROM mensagens ORDER BY "dataHora" ASC'),
      pool.query('SELECT * FROM regras ORDER BY id ASC'),
      pool.query('SELECT * FROM crm_config WHERE id = 1'),
      pool.query('SELECT * FROM logs ORDER BY timestamp DESC'),
      pool.query('SELECT * FROM polos ORDER BY nome ASC'),
      pool.query('SELECT * FROM cursos ORDER BY nome ASC'),
      pool.query('SELECT * FROM users ORDER BY name ASC'),
      pool.query('SELECT * FROM smtp_config WHERE id = 1'),
      pool.query('SELECT * FROM global_settings WHERE id = 1')
    ]);

    const crm = crmRes.rows[0] || {};
    const smtp = smtpRes.rows[0] || {};
    const globalS = globalRes.rows[0] || {};

    return {
      alunos: alunosRes.rows.map(a => ({
        ...a,
        valorPendente: parseFloat(a.valorPendente),
        valorMensalidade: a.valorMensalidade != null ? parseFloat(a.valorMensalidade) : undefined
      })),
      parcelas: parcelasRes.rows.map(p => ({
        ...p,
        valorOriginal: parseFloat(p.valorOriginal),
        valorAtual: parseFloat(p.valorAtual)
      })),
      parcelaHistorico: historicoRes.rows,
      mensagens: mensagensRes.rows,
      regras: regrasRes.rows.map(r => ({
        ...r,
        canal: r.canal || 'WHATSAPP',
        destinatario: r.destinatario || 'ALUNO'
      })),
      crmConfig: {
        apiKey: crm.apiKey || '',
        urlWebhook: crm.urlWebhook || '',
        sincronizacaoAtiva: crm.sincronizacaoAtiva ?? true,
        logSincronizacao: crm.logSincronizacao || [],
        pipelines: crm.pipelines || [],
        tagMap: crm.tagMap || {}
      },
      logs: logsRes.rows,
      polos: polosRes.rows.map(p => p.nome),
      cursos: cursosRes.rows.map(c => c.nome),
      users: usersRes.rows,
      smtpConfig: {
        host: smtp.host || 'smtp.zeptomail.com',
        port: smtp.port || 587,
        user: smtp.username || 'emailapikey',
        pass: smtp.password || '',
        fromEmail: smtp.fromEmail || '',
        fromName: smtp.fromName || 'Instituto Sentidos',
        secure: smtp.secure ?? false,
        active: smtp.active ?? false
      },
      globalSettings: {
        teamPhoneNumber: globalS.teamPhoneNumber || ''
      }
    };
  } catch (error) {
    console.error('[Database] Erro ao ler do PostgreSQL:', error);
    throw error;
  }
}

// Helper to sanitize query parameter arrays, replacing undefined values with null
// to avoid node-postgres throwing errors when executing PostgreSQL queries.
const cleanParams = (arr: any[]): any[] => arr.map(v => v === undefined ? null : v);

// Write/Sync database
export async function writeDB(data: DbData): Promise<void> {
  if (!usePg || !pool) {
    writeDBJson(data);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('TRUNCATE TABLE polos, cursos, users, alunos, parcelas, parcela_historico, mensagens, regras, crm_config, logs, smtp_config, global_settings RESTART IDENTITY CASCADE');

    if (Array.isArray(data.polos)) {
      for (const polo of data.polos) {
        await client.query('INSERT INTO polos (nome) VALUES ($1)', [polo]);
      }
    }

    if (Array.isArray(data.cursos)) {
      for (const curso of data.cursos) {
        await client.query('INSERT INTO cursos (nome) VALUES ($1)', [curso]);
      }
    }

    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        await client.query(
          'INSERT INTO users (id, name, email, password, role, active) VALUES ($1, $2, $3, $4, $5, $6)',
          cleanParams([u.id, u.name, u.email, u.password, u.role, u.active ?? true])
        );
      }
    }

    if (Array.isArray(data.alunos)) {
      for (const a of data.alunos) {
        await client.query(
          `INSERT INTO alunos (
            id, nome, cpf, matricula, curso, polo, whatsapp, email,
            "statusFinanceiro", "valorPendente", "avatarUrl", "cadastroData",
            modalidade, "cobrancaAutomatica", turma, "valorMensalidade",
            "totalParcelas", "parcelasPagas", "primeiroVencimentoEmAberto",
            "diaVencimento", "dataMatriculaFinanceira", observacoes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
          cleanParams([
            a.id, a.nome, a.cpf, a.matricula, a.curso, a.polo, a.whatsapp, a.email,
            a.statusFinanceiro, a.valorPendente, a.avatarUrl, a.cadastroData,
            a.modalidade, a.cobrancaAutomatica ?? true, a.turma, a.valorMensalidade,
            a.totalParcelas, a.parcelasPagas, a.primeiroVencimentoEmAberto,
            a.diaVencimento, a.dataMatriculaFinanceira, a.observacoes
          ])
        );
      }
    }

    if (Array.isArray(data.parcelas)) {
      for (const p of data.parcelas) {
        await client.query(
          `INSERT INTO parcelas (
            id, "alunoId", "alunoNome", curso, turma, polo, "numeroParcela", "totalParcelas",
            competencia, vencimento, "valorOriginal", "valorAtual", status, origem,
            "dataPagamento", observacoes, "enviadoWhatsAppCount", "ultimoEnvio", "criadoEm", "atualizadoEm"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          cleanParams([
            p.id, p.alunoId, p.alunoNome, p.curso, p.turma, p.polo, p.numeroParcela, p.totalParcelas,
            p.competencia, p.vencimento, p.valorOriginal, p.valorAtual, p.status, p.origem,
            p.dataPagamento, p.observacoes, p.enviadoWhatsAppCount || 0, p.ultimoEnvio, p.criadoEm, p.atualizadoEm
          ])
        );
      }
    }

    if (Array.isArray(data.parcelaHistorico)) {
      for (const h of data.parcelaHistorico) {
        await client.query(
          `INSERT INTO parcela_historico (id, "parcelaId", "alunoId", data, acao, observacao, usuario)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          cleanParams([h.id, h.parcelaId, h.alunoId, h.data, h.acao, h.observacao, h.usuario])
        );
      }
    }

    if (Array.isArray(data.mensagens)) {
      for (const m of data.mensagens) {
        await client.query(
          `INSERT INTO mensagens (id, "alunoId", tipo, texto, "dataHora", "statusEnvio")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          cleanParams([m.id, m.alunoId, m.tipo, m.texto, m.dataHora, m.statusEnvio])
        );
      }
    }

    if (Array.isArray(data.regras)) {
      for (const r of data.regras) {
        await client.query(
          `INSERT INTO regras (id, titulo, descricao, "diasGatilho", "tipoGatilho", "mensagemTemplate", ativo, "horarioEnvio", canal, destinatario)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          cleanParams([
            r.id, r.titulo, r.descricao, r.diasGatilho, r.tipoGatilho, r.mensagemTemplate,
            r.ativo ?? true, r.horarioEnvio, r.canal || 'WHATSAPP', r.destinatario || 'ALUNO'
          ])
        );
      }
    }

    if (data.crmConfig) {
      const c = data.crmConfig;
      await client.query(
        `INSERT INTO crm_config (
          id, "apiKey", "urlWebhook", "sincronizacaoAtiva",
          "logSincronizacao", pipelines, "tagMap"
        ) VALUES (1, $1, $2, $3, $4, $5, $6)`,
        cleanParams([
          c.apiKey, c.urlWebhook, c.sincronizacaoAtiva ?? true,
          JSON.stringify(c.logSincronizacao || []),
          JSON.stringify(c.pipelines || []),
          JSON.stringify(c.tagMap || {})
        ])
      );
    }

    if (Array.isArray(data.logs)) {
      for (const l of data.logs) {
        await client.query(
          `INSERT INTO logs (id, timestamp, tipo, usuario, detalhe, sucesso)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          cleanParams([l.id, l.timestamp, l.tipo, l.usuario, l.detalhe, l.sucesso ?? true])
        );
      }
    }

    if (data.smtpConfig) {
      const s = data.smtpConfig;
      await client.query(
        `INSERT INTO smtp_config (id, host, port, username, password, "fromEmail", "fromName", secure, active)
         VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)`,
        cleanParams([s.host, s.port, s.user, s.pass, s.fromEmail, s.fromName, s.secure ?? false, s.active ?? false])
      );
    }

    if (data.globalSettings) {
      const g = data.globalSettings;
      await client.query(
        `INSERT INTO global_settings (id, "teamPhoneNumber") VALUES (1, $1)`,
        cleanParams([g.teamPhoneNumber])
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Database] Erro ao persistir dados no PostgreSQL (ROLLBACK executado):', error);
    throw error;
  } finally {
    client.release();
  }
}

