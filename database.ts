import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  INITIAL_ALUNOS, 
  INITIAL_BOLETOS, 
  INITIAL_WHATSAPP_MENSAGENS, 
  INITIAL_COBRANCA_REGRAS, 
  INITIAL_CRM_CONFIG, 
  INITIAL_LOGS_ATIVIDADE,
  INITIAL_POLOS,
  INITIAL_USERS
} from './src/mockData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

export interface DbData {
  alunos: any[];
  boletos: any[];
  mensagens: any[];
  regras: any[];
  crmConfig: any;
  logs: any[];
  polos: string[];
  users: any[];
}

export function getInitialData(): DbData {
  return {
    alunos: INITIAL_ALUNOS,
    boletos: INITIAL_BOLETOS,
    mensagens: INITIAL_WHATSAPP_MENSAGENS,
    regras: INITIAL_COBRANCA_REGRAS,
    crmConfig: INITIAL_CRM_CONFIG,
    logs: INITIAL_LOGS_ATIVIDADE,
    polos: INITIAL_POLOS,
    users: INITIAL_USERS
  };
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
    if (!parsed.users) {
      parsed.users = INITIAL_USERS;
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
    }
    return;
  }

  try {
    console.log('[Database] Criando tabelas no PostgreSQL caso não existam...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS polos (
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

      CREATE TABLE IF NOT EXISTS boletos (
        id VARCHAR(100) PRIMARY KEY,
        "alunoId" VARCHAR(100) NOT NULL,
        "alunoNome" VARCHAR(255) NOT NULL,
        competencia VARCHAR(50) NOT NULL,
        vencimento VARCHAR(50) NOT NULL,
        valor NUMERIC(12, 2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        "linhaDigitavel" VARCHAR(255) NOT NULL,
        "nossoNumero" VARCHAR(100) NOT NULL,
        "pdfUrl" VARCHAR(500) NOT NULL,
        "enviadoWhatsAppCount" INTEGER DEFAULT 0,
        "ultimoEnvio" VARCHAR(50)
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
        "horarioEnvio" VARCHAR(10) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crm_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        "apiKey" VARCHAR(255),
        "urlWebhook" VARCHAR(255),
        "sincronizacaoAtiva" BOOLEAN DEFAULT TRUE,
        "logSincronizacao" JSONB DEFAULT '[]'::jsonb,
        pipelines JSONB DEFAULT '[]'::jsonb,
        "tagMap" JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS logs (
        id VARCHAR(100) PRIMARY KEY,
        timestamp VARCHAR(50) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        usuario VARCHAR(255),
        detalhe TEXT NOT NULL,
        sucesso BOOLEAN NOT NULL
      );

      -- Garante a existência do registro padrão id=1
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
            
            // Mark the local file as migrated instead of renaming to avoid Docker volume mount lock issues
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
      boletosRes,
      mensagensRes,
      regrasRes,
      crmRes,
      logsRes,
      polosRes,
      usersRes
    ] = await Promise.all([
      pool.query('SELECT * FROM alunos ORDER BY nome ASC'),
      pool.query('SELECT * FROM boletos ORDER BY vencimento DESC'),
      pool.query('SELECT * FROM mensagens ORDER BY "dataHora" ASC'),
      pool.query('SELECT * FROM regras ORDER BY id ASC'),
      pool.query('SELECT * FROM crm_config WHERE id = 1'),
      pool.query('SELECT * FROM logs ORDER BY timestamp DESC'),
      pool.query('SELECT * FROM polos ORDER BY nome ASC'),
      pool.query('SELECT * FROM users ORDER BY name ASC')
    ]);

    const crm = crmRes.rows[0] || {};

    return {
      alunos: alunosRes.rows.map(a => ({
        ...a,
        valorPendente: parseFloat(a.valorPendente)
      })),
      boletos: boletosRes.rows.map(b => ({
        ...b,
        valor: parseFloat(b.valor)
      })),
      mensagens: mensagensRes.rows,
      regras: regrasRes.rows,
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
      users: usersRes.rows
    };
  } catch (error) {
    console.error('[Database] Erro ao ler do PostgreSQL:', error);
    throw error;
  }
}

// Write/Sync database
export async function writeDB(data: DbData): Promise<void> {
  if (!usePg || !pool) {
    writeDBJson(data);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('TRUNCATE TABLE polos, users, alunos, boletos, mensagens, regras, crm_config, logs RESTART IDENTITY CASCADE');

    if (Array.isArray(data.polos)) {
      for (const polo of data.polos) {
        await client.query('INSERT INTO polos (nome) VALUES ($1)', [polo]);
      }
    }

    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        await client.query(
          'INSERT INTO users (id, name, email, password, role, active) VALUES ($1, $2, $3, $4, $5, $6)',
          [u.id, u.name, u.email, u.password, u.role, u.active ?? true]
        );
      }
    }

    if (Array.isArray(data.alunos)) {
      for (const a of data.alunos) {
        await client.query(
          `INSERT INTO alunos (
            id, nome, cpf, matricula, curso, polo, whatsapp, email, 
            "statusFinanceiro", "valorPendente", "avatarUrl", "cadastroData", 
            modalidade, "cobrancaAutomatica"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            a.id, a.nome, a.cpf, a.matricula, a.curso, a.polo, a.whatsapp, a.email,
            a.statusFinanceiro, a.valorPendente, a.avatarUrl, a.cadastroData,
            a.modalidade, a.cobrancaAutomatica ?? true
          ]
        );
      }
    }

    if (Array.isArray(data.boletos)) {
      for (const b of data.boletos) {
        await client.query(
          `INSERT INTO boletos (
            id, "alunoId", "alunoNome", competencia, vencimento, valor, status, 
            "linhaDigitavel", "nossoNumero", "pdfUrl", "enviadoWhatsAppCount", "ultimoEnvio"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            b.id, b.alunoId, b.alunoNome, b.competencia, b.vencimento, b.valor, b.status,
            b.linhaDigitavel, b.nossoNumero, b.pdfUrl, b.enviadoWhatsAppCount || 0, b.ultimoEnvio
          ]
        );
      }
    }

    if (Array.isArray(data.mensagens)) {
      for (const m of data.mensagens) {
        await client.query(
          `INSERT INTO mensagens (id, "alunoId", tipo, texto, "dataHora", "statusEnvio") 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [m.id, m.alunoId, m.tipo, m.texto, m.dataHora, m.statusEnvio]
        );
      }
    }

    if (Array.isArray(data.regras)) {
      for (const r of data.regras) {
        await client.query(
          `INSERT INTO regras (id, titulo, descricao, "diasGatilho", "tipoGatilho", "mensagemTemplate", ativo, "horarioEnvio") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            r.id, r.titulo, r.descricao, r.diasGatilho, r.tipoGatilho, r.mensagemTemplate,
            r.ativo ?? true, r.horarioEnvio
          ]
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
        [
          c.apiKey, c.urlWebhook, c.sincronizacaoAtiva ?? true,
          JSON.stringify(c.logSincronizacao || []),
          JSON.stringify(c.pipelines || []),
          JSON.stringify(c.tagMap || {})
        ]
      );
    }

    if (Array.isArray(data.logs)) {
      for (const l of data.logs) {
        await client.query(
          `INSERT INTO logs (id, timestamp, tipo, usuario, detalhe, sucesso) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [l.id, l.timestamp, l.tipo, l.usuario, l.detalhe, l.sucesso ?? true]
        );
      }
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
