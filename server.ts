import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { readDB, writeDB, initDb, getInitialData, backupDatabaseFile } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

type SessionData = {
  email: string;
  name?: string;
  role?: string;
  expiresAt: number;
};

type BulkJob = {
  id: string;
  status: 'RUNNING' | 'DONE' | 'ERROR';
  total: number;
  sent: number;
  failed: number;
  current?: string;
  startedAt: string;
  finishedAt?: string;
  message: string;
  errors: string[];
};

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, SessionData>();
const bulkJobs = new Map<string, BulkJob>();
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'sentidos-cobrancas-local-secret-change-me';

const base64UrlEncode = (value: string): string =>
  Buffer.from(value, 'utf-8').toString('base64url');

const base64UrlDecode = (value: string): string =>
  Buffer.from(value, 'base64url').toString('utf-8');

const signTokenPayload = (payload: string): string =>
  crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
};

const verifyPassword = (password: string, stored?: string): boolean => {
  if (!stored) return false;
  if (!stored.startsWith('pbkdf2$')) {
    return stored === password;
  }
  const [, iterationsRaw, salt, expected] = stored.split('$');
  const iterations = Number(iterationsRaw);
  if (!iterations || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
};

const createSession = (user: any): string => {
  const session: SessionData = {
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = signTokenPayload(payload);
  const token = `${payload}.${signature}`;
  sessions.set(token, session);
  return token;
};

const verifySessionToken = (token: string): SessionData | null => {
  const inMemory = sessions.get(token);
  if (inMemory && inMemory.expiresAt >= Date.now()) {
    return inMemory;
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = signTokenPayload(payload);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as SessionData;
    if (!parsed.email || !parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
    sessions.set(token, parsed);
    return parsed;
  } catch {
    return null;
  }
};

const publicApiPaths = new Set(['/api/login', '/api/password-recovery', '/api/status', '/api/whatsapp/webhook']);

const requireAuth: express.RequestHandler = (req, res, next) => {
  const originalPath = req.originalUrl.split('?')[0];
  if (publicApiPaths.has(originalPath)) {
    return next();
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = token ? verifySessionToken(token) : null;
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ success: false, message: 'SessÃ£o invÃ¡lida ou expirada. Faça login novamente.' });
  }
  (req as any).user = session;
  next();
};

// Helper functions to parse and match phone numbers
const cleanNumber = (numStr: string): string => {
  if (!numStr) return '';
  return numStr.replace(/\D/g, '');
};

const numbersMatch = (num1: string, num2: string): boolean => {
  const c1 = cleanNumber(num1);
  const c2 = cleanNumber(num2);
  if (!c1 || !c2) return false;
  // Match last 8 digits (standard Brazilian local numbers) to account for optional 9th digit and country code variations
  const len = Math.min(c1.length, c2.length);
  if (len < 8) return false;
  return c1.substring(c1.length - len) === c2.substring(c2.length - len);
};

function sanitizePhoneNumber(numStr: string): string {
  const cleaned = (numStr || '').replace(/\D/g, '');
  if (cleaned.length >= 10 && cleaned.length <= 11 && !cleaned.startsWith('55')) {
    return '55' + cleaned;
  }
  return cleaned;
}

function randomDelayMs(minSec: number, maxSec: number): number {
  const min = Math.max(5, Number(minSec) || 15);
  const max = Math.max(min, Number(maxSec) || min);
  return Math.floor(Math.random() * ((max - min) * 1000 + 1)) + min * 1000;
}

function getEvolutionConfig(db: any) {
  const evo = db.globalSettings?.evolutionConfig || {};
  const apiKey = String(evo.instanceToken || evo.globalToken || '').trim();
  const apiBase = String(evo.url || '').replace(/\/$/, '');
  const instanceName = String(evo.instanceName || '').trim();
  if (!apiBase || !instanceName || !apiKey) {
    throw new Error('Evolution API nÃ£o configurada. Informe URL, instÃ¢ncia e token em ConfiguraÃ§Ãµes.');
  }
  return { apiBase, instanceName, apiKey };
}

async function sendEvolutionText(db: any, numberStr: string, text: string): Promise<any> {
  const { apiBase, instanceName, apiKey } = getEvolutionConfig(db);
  const number = sanitizePhoneNumber(numberStr);
  if (!number) {
    throw new Error('NÃºmero de WhatsApp invÃ¡lido.');
  }
  const resp = await fetch(`${apiBase}/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
    body: JSON.stringify({ number, text, delay: 1200, linkPreview: false })
  });
  const contentType = resp.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await resp.json().catch(() => ({})) : await resp.text().catch(() => '');
  if (!resp.ok) {
    const detail = typeof payload === 'string' ? payload : payload?.message || payload?.error || JSON.stringify(payload);
    throw new Error(`Evolution API HTTP ${resp.status}${detail ? `: ${detail}` : ''}`);
  }
  return payload;
}

function findTemplateParcela(db: any, alunoId: string) {
  const parcelas = (db.parcelas || [])
    .filter((p: any) => p.alunoId === alunoId)
    .sort((a: any, b: any) => Number(a.numeroParcela || 0) - Number(b.numeroParcela || 0));
  return parcelas.find((p: any) => p.status === 'ATRASADO')
    || parcelas.find((p: any) => p.status === 'PENDENTE')
    || parcelas[0]
    || null;
}

function buildStudentMessage(template: string, aluno: any, parcela: any | null): string {
  if (!parcela) {
    return template
      .replace(/{nome_aluno}/g, aluno.nome || '')
      .replace(/{curso}/g, aluno.curso || '')
      .replace(/{valor_boleto}/g, `R$ ${Number(aluno.valorMensalidade || aluno.valorPendente || 0).toFixed(2)}`)
      .replace(/{valor}/g, `R$ ${Number(aluno.valorMensalidade || aluno.valorPendente || 0).toFixed(2)}`)
      .replace(/{vencimento_boleto}/g, aluno.primeiroVencimentoEmAberto || '')
      .replace(/{vencimento}/g, aluno.primeiroVencimentoEmAberto || '')
      .replace(/{parcela}/g, '')
      .replace(/{linha_digitavel}/g, '')
      .replace(/{competencia}/g, '')
      .replace(/{link_pdf}/g, '');
  }
  return buildMsgScheduler(template, aluno, parcela);
}

// Login verification
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const db = await readDB();
    const matchedUser = db.users?.find((u: any) => u.email === email && verifyPassword(password, u.password));

    if (matchedUser) {
      if (matchedUser.active === false) {
        return res.status(403).json({ success: false, message: 'UsuÃ¡rio inativo.' });
      }
      if (!String(matchedUser.password || '').startsWith('pbkdf2$')) {
        matchedUser.password = hashPassword(password);
        await writeDB(db);
      }
      const token = createSession(matchedUser);
      return res.json({ 
        success: true, 
        message: 'Autenticado com sucesso!', 
        user: { email: matchedUser.email, name: matchedUser.name, role: matchedUser.role },
        token
      });
    }

    return res.status(401).json({ success: false, message: 'Credenciais inválidas para o painel FAEPI.' });
  } catch (err: any) {
    console.error('Error during login:', err);
    return res.status(500).json({ success: false, message: 'Erro interno ao autenticar usuário.' });
  }
});

app.post('/api/password-recovery', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, message: 'Informe o e-mail cadastrado.' });
  }

  try {
    const db = await readDB();
    const user = db.users?.find((u: any) => String(u.email || '').trim().toLowerCase() === email);
    const genericMessage = 'Se o e-mail estiver cadastrado, enviaremos uma senha provisória em alguns instantes.';

    if (!user || user.active === false) {
      return res.json({ success: true, message: genericMessage });
    }

    const smtpConfig = db.smtpConfig;
    if (!smtpConfig?.active || !smtpConfig.host || !smtpConfig.user || !smtpConfig.pass || !smtpConfig.fromEmail) {
      return res.status(400).json({
        success: false,
        message: 'SMTP não configurado ou inativo. Ative e salve as credenciais em Configurações > Notificações & SMTP.'
      });
    }

    const temporaryPassword = `Sentidos-${crypto.randomBytes(4).toString('hex')}`;
    const oldPassword = user.password;
    user.password = hashPassword(temporaryPassword);
    await writeDB(db);

    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: Number(smtpConfig.port),
        secure: smtpConfig.secure ?? false,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        }
      });

      await transporter.sendMail({
        from: `"${smtpConfig.fromName || 'Instituto Sentidos'}" <${smtpConfig.fromEmail}>`,
        to: user.email,
        subject: 'Recuperação de senha - Sentidos Cobranças',
        text: [
          `Olá, ${user.name || 'usuário'}.`,
          '',
          'Recebemos uma solicitação de recuperação de senha para o painel Sentidos Cobranças.',
          `Sua senha provisória é: ${temporaryPassword}`,
          '',
          'Após acessar o sistema, altere sua senha em Configurações > Usuários.',
          'Se você não solicitou esta recuperação, avise a equipe responsável.'
        ].join('\n'),
        html: `
          <p>Olá, ${user.name || 'usuário'}.</p>
          <p>Recebemos uma solicitação de recuperação de senha para o painel <strong>Sentidos Cobranças</strong>.</p>
          <p>Sua senha provisória é: <strong>${temporaryPassword}</strong></p>
          <p>Após acessar o sistema, altere sua senha em <strong>Configurações &gt; Usuários</strong>.</p>
          <p>Se você não solicitou esta recuperação, avise a equipe responsável.</p>
        `
      });

      return res.json({ success: true, message: genericMessage });
    } catch (mailErr: any) {
      console.error('[SMTP] Password recovery email failed:', mailErr);
      user.password = oldPassword;
      await writeDB(db);
      return res.status(500).json({
        success: false,
        message: 'Não foi possível enviar o e-mail de recuperação. Verifique as credenciais SMTP.',
        error: mailErr?.message || 'Erro SMTP desconhecido.'
      });
    }
  } catch (err: any) {
    console.error('[Auth] Password recovery failed:', err);
    return res.status(500).json({ success: false, message: 'Erro interno ao processar recuperação de senha.' });
  }
});

app.use('/api', requireAuth);

// Status / Health check
app.get('/api/status', async (req, res) => {
  try {
    const db = await readDB();
    res.json({ 
      status: 'OK', 
      message: 'Backend do Sentidos Cobranças está rodando!', 
      database: 'conectado',
      stats: {
        alunos: db.alunos.length,
        parcelas: db.parcelas.length,
        mensagens: db.mensagens.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Backend rodando, mas com erro ao se conectar com o banco de dados.', 
      error: err.message 
    });
  }
});

// Get complete DB
app.get('/api/db', async (req, res) => {
  try {
    const data = await readDB();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset database
app.post('/api/reset', async (_req, res) => {
  console.log('[Sentidos Cobranças] Recebida requisição /api/reset. Reiniciando banco de dados para os valores padrão...');
  // Ajuste F7: sem backup válido, a operação não prossegue.
  if (!backupDatabaseFile()) {
    return res.status(500).json({ success: false, error: 'Backup de segurança falhou. Operação de reset abortada para evitar perda de dados.' });
  }
  try {
    const initial = getInitialData();
    await writeDB(initial);
    res.json({ success: true, message: 'Banco de dados reiniciado e limpo com sucesso!', data: initial });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save complete database state
app.post('/api/save-all', async (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: 'Dados inválidos' });
  }
  const required = ['alunos', 'parcelas', 'mensagens', 'regras', 'crmConfig', 'logs', 'polos', 'cursos', 'users', 'smtpConfig', 'globalSettings'];
  const hasRequired = required.every(key => key in data);
  if (!hasRequired) {
    return res.status(400).json({ success: false, message: 'Dados incompletos para persistência' });
  }
  // parcelaHistorico é opcional para compatibilidade; garante array.
  if (!('parcelaHistorico' in data)) {
    data.parcelaHistorico = [];
  }
  console.log(`[Sentidos Cobranças] Recebida requisição /api/save-all. Salvando ${data.alunos.length} alunos, ${data.parcelas.length} parcelas...`);
  try {
    await writeDB(data);
    res.json({ success: true, message: 'Banco de dados salvo com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alunos CRUD
app.get('/api/alunos', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.alunos);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/alunos', async (req, res) => {
  try {
    const db = await readDB();
    const novoAluno = req.body;
    
    // check duplicate
    const idx = db.alunos.findIndex((a: any) => a.id === novoAluno.id);
    if (idx > -1) {
      db.alunos[idx] = novoAluno;
    } else {
      db.alunos.push(novoAluno);
    }
    
    await writeDB(db);
    res.json({ success: true, data: novoAluno });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/alunos/:id', async (req, res) => {
  try {
    const db = await readDB();
    const id = req.params.id;
    const idx = db.alunos.findIndex((a: any) => a.id === id);
    if (idx > -1) {
      db.alunos[idx] = { ...db.alunos[idx], ...req.body };
      await writeDB(db);
      res.json({ success: true, data: db.alunos[idx] });
    } else {
      res.status(404).json({ success: false, message: 'Aluno não encontrado' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Parcelas CRUD
app.get('/api/parcelas', async (_req, res) => {
  try {
    const db = await readDB();
    res.json(db.parcelas);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/parcelas', async (req, res) => {
  try {
    const db = await readDB();
    const novaParcela = req.body;
    const idx = db.parcelas.findIndex((p: any) => p.id === novaParcela.id);
    if (idx > -1) {
      db.parcelas[idx] = novaParcela;
    } else {
      db.parcelas.push(novaParcela);
    }
    await writeDB(db);
    res.json({ success: true, data: novaParcela });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/parcelas/:id', async (req, res) => {
  try {
    const db = await readDB();
    const id = req.params.id;
    const idx = db.parcelas.findIndex((p: any) => p.id === id);
    if (idx > -1) {
      db.parcelas[idx] = { ...db.parcelas[idx], ...req.body };
      await writeDB(db);
      res.json({ success: true, data: db.parcelas[idx] });
    } else {
      res.status(404).json({ success: false, message: 'Parcela não encontrada' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mensagens CRUD
app.get('/api/mensagens', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.mensagens);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/mensagens', async (req, res) => {
  try {
    const db = await readDB();
    const novaMsg = req.body;
    db.mensagens.push(novaMsg);
    await writeDB(db);
    res.json({ success: true, data: novaMsg });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Regras CRUD
app.get('/api/regras', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.regras);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/regras', async (req, res) => {
  try {
    const db = await readDB();
    const regras = req.body;
    if (Array.isArray(regras)) {
      db.regras = regras;
    } else {
      db.regras.push(regras);
    }
    await writeDB(db);
    res.json({ success: true, data: db.regras });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CRM Config CRUD
app.get('/api/crmConfig', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.crmConfig);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/crmConfig', async (req, res) => {
  try {
    const db = await readDB();
    db.crmConfig = req.body;
    await writeDB(db);
    res.json({ success: true, data: db.crmConfig });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Logs CRUD
app.get('/api/logs', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.logs);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const db = await readDB();
    const novoLog = req.body;
    db.logs.unshift(novoLog);
    await writeDB(db);
    res.json({ success: true, data: novoLog });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send test email endpoint
app.post('/api/send-test-email', async (req, res) => {
  const { smtpConfig, testEmail } = req.body;
  if (!smtpConfig || !testEmail) {
    return res.status(400).json({ success: false, message: 'Dados incompletos para envio de teste.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      secure: smtpConfig.secure ?? false,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    });

    const info = await transporter.sendMail({
      from: `"${smtpConfig.fromName || 'Instituto Sentidos'}" <${smtpConfig.fromEmail}>`,
      to: testEmail,
      subject: 'Teste de Configuração SMTP — Sentidos Cobranças',
      text: 'Olá! Este é um e-mail de teste enviado pelo sistema de Cobrança Automatizada do Instituto Sentidos / FAEPI. Suas configurações SMTP foram validadas com sucesso!',
      html: '<p>Olá!</p><p>Este é um e-mail de teste enviado pelo sistema de <strong>Cobrança Automatizada do Instituto Sentidos / FAEPI</strong>.</p><p>Suas configurações SMTP foram validadas com sucesso!</p>'
    });

    console.log('[SMTP] Test email sent: %s', info.messageId);
    return res.json({ success: true, message: `E-mail de teste enviado com sucesso! Message ID: ${info.messageId}` });
  } catch (err: any) {
    console.error('[SMTP] Test email failed:', err);
    return res.status(500).json({ success: false, error: err.message || err });
  }
});

// Send actual billing email
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, message: 'Parâmetros "to", "subject" e "body" são obrigatórios.' });
  }

  try {
    const db = await readDB();
    const smtpConfig = db.smtpConfig;

    if (!smtpConfig || !smtpConfig.active) {
      return res.status(400).json({ success: false, message: 'Integração de e-mail desativada ou não configurada.' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      secure: smtpConfig.secure ?? false,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    });

    const info = await transporter.sendMail({
      from: `"${smtpConfig.fromName || 'Instituto Sentidos'}" <${smtpConfig.fromEmail}>`,
      to,
      subject,
      text: body.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
      html: body
    });

    console.log('[SMTP] Billing email sent to %s: %s', to, info.messageId);
    return res.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('[SMTP] Billing email failed:', err);
    return res.status(500).json({ success: false, error: err.message || err });
  }
});

// Proxy WhatsApp Evolution API to avoid CORS issues in the browser
app.post('/api/whatsapp/proxy', async (req, res) => {
  const { url, method, headers, body } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL é obrigatória.' });
  }

  try {
    const db = await readDB();
    const { apiBase } = getEvolutionConfig(db);
    const requested = new URL(url);
    const allowed = new URL(apiBase);
    if (requested.origin !== allowed.origin) {
      return res.status(403).json({ success: false, message: 'Proxy bloqueado: URL fora da Evolution API configurada.' });
    }
    const safeMethod = String(method || 'GET').toUpperCase();
    if (!['GET', 'POST', 'DELETE'].includes(safeMethod)) {
      return res.status(405).json({ success: false, message: 'Metodo nao permitido no proxy.' });
    }
    const fetchResponse = await fetch(url, {
      method: safeMethod,
      headers: headers || {},
      body: body ? JSON.stringify(body) : undefined
    });

    const status = fetchResponse.status;
    const contentType = fetchResponse.headers.get('content-type') || '';

    let responseData;
    if (contentType && contentType.includes('application/json')) {
      responseData = await fetchResponse.json();
    } else {
      responseData = await fetchResponse.text();
    }

    res.status(status).send(responseData);
  } catch (error: any) {
    console.error('Error in WhatsApp proxy endpoint:', error);
    res.status(500).json({ success: false, message: error.message || 'Erro de comunicação com a Evolution API.' });
  }
});

app.post('/api/whatsapp/send-text', async (req, res) => {
  const { number, text } = req.body;
  if (!number || !text) {
    return res.status(400).json({ success: false, message: 'Numero e texto sao obrigatorios.' });
  }
  try {
    const db = await readDB();
    const result = await sendEvolutionText(db, number, text);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Falha ao enviar WhatsApp.' });
  }
});

app.post('/api/whatsapp/test-connection', async (req, res) => {
  const { url, instanceName, instanceToken, globalToken } = req.body;
  if (!url || !instanceName) {
    return res.status(400).json({ success: false, message: 'URL e instancia sao obrigatorias.' });
  }
  try {
    const baseUrl = String(url).replace(/\/$/, '');
    const parsed = new URL(baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ success: false, message: 'URL da Evolution API invalida.' });
    }
    const apiKey = String(instanceToken || globalToken || '').trim();
    const response = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(String(instanceName))}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({ success: false, state: 'ERROR', details: data, message: data?.message || `HTTP ${response.status}` });
    }
    const state = data?.instance?.state || data?.state || 'close';
    res.json({ success: true, connected: state === 'open', state, details: data });
  } catch (err: any) {
    res.status(500).json({ success: false, state: 'OFFLINE', message: err.message || 'Falha ao testar Evolution API.' });
  }
});

app.post('/api/whatsapp/bulk', async (req, res) => {
  const { alunoIds, text, minIntervalSec, maxIntervalSec, respectCobrancaAutomatica = true } = req.body;
  if (!Array.isArray(alunoIds) || alunoIds.length === 0 || !text || typeof text !== 'string') {
    return res.status(400).json({ success: false, message: 'Informe alunos e mensagem para o disparo em massa.' });
  }

  const jobId = `bulk-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const job: BulkJob = {
    id: jobId,
    status: 'RUNNING',
    total: alunoIds.length,
    sent: 0,
    failed: 0,
    startedAt: new Date().toISOString(),
    message: 'Disparo em massa iniciado.',
    errors: []
  };
  bulkJobs.set(jobId, job);
  res.json({ success: true, jobId });

  void (async () => {
    try {
      const db = await readDB();
      getEvolutionConfig(db);
      const minSec = Number(minIntervalSec ?? db.globalSettings?.dispatchMinIntervalSec ?? 15);
      const maxSec = Number(maxIntervalSec ?? db.globalSettings?.dispatchMaxIntervalSec ?? 45);
      const ids = Array.from(new Set(alunoIds.map((id: any) => String(id))));

      for (let i = 0; i < ids.length; i++) {
        const aluno = db.alunos.find((a: any) => a.id === ids[i]);
        if (!aluno) {
          job.failed++;
          job.errors.push(`Aluno ${ids[i]} nao encontrado.`);
          continue;
        }
        if (respectCobrancaAutomatica && aluno.cobrancaAutomatica === false) {
          job.failed++;
          job.errors.push(`${aluno.nome}: cobranca automatica desativada.`);
          continue;
        }
        job.current = aluno.nome;
        try {
          const parcela = findTemplateParcela(db, aluno.id);
          const rendered = buildStudentMessage(text, aluno, parcela);
          await sendEvolutionText(db, aluno.whatsapp, rendered);
          const now = new Date().toISOString();
          db.mensagens.push({
            id: `msg-${Date.now()}-${i}`,
            alunoId: aluno.id,
            tipo: 'HUMANO_AGENTE',
            texto: rendered,
            dataHora: now,
            statusEnvio: 'ENTREGUE'
          });
          db.logs.unshift({
            id: `log-${Date.now()}-${i}`,
            timestamp: now.replace('T', ' ').substring(0, 19),
            tipo: 'WHATSAPP',
            usuario: 'Disparo em Massa',
            detalhe: `Mensagem em massa enviada para ${aluno.nome}.`,
            sucesso: true
          });
          job.sent++;
        } catch (err: any) {
          job.failed++;
          job.errors.push(`${aluno.nome}: ${err.message || err}`);
        }
        if (i < ids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, randomDelayMs(minSec, maxSec)));
        }
      }

      db.logs.unshift({
        id: `log-${Date.now()}-bulk`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        tipo: 'WHATSAPP',
        usuario: 'Disparo em Massa',
        detalhe: `Disparo em massa finalizado: ${job.sent} enviado(s), ${job.failed} falha(s).`,
        sucesso: job.failed === 0
      });
      await writeDB(db);
      job.status = 'DONE';
      job.current = undefined;
      job.finishedAt = new Date().toISOString();
      job.message = `Finalizado: ${job.sent} enviado(s), ${job.failed} falha(s).`;
    } catch (err: any) {
      job.status = 'ERROR';
      job.finishedAt = new Date().toISOString();
      job.message = err.message || 'Falha no disparo em massa.';
      job.errors.push(job.message);
    }
  })();
});

app.get('/api/whatsapp/bulk/:id', (req, res) => {
  const job = bulkJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Disparo em massa nao encontrado.' });
  }
  res.json({ success: true, job });
});

// Webhook endpoint to receive events from Evolution API
app.post('/api/whatsapp/webhook', async (req, res) => {
  const { event, data } = req.body;
  
  if (!event || !data) {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  // Support both 'messages.upsert' and standard 'MESSAGES_UPSERT'
  const isMessageUpsert = event === 'messages.upsert' || event === 'MESSAGES_UPSERT';
  
  if (isMessageUpsert) {
    const fromMe = data.key?.fromMe;
    const remoteJid = data.key?.remoteJid || '';
    const senderNumber = remoteJid.split('@')[0];
    
    // Extract text content safely
    let text = '';
    if (data.message) {
      text = data.message.conversation || 
             data.message.extendedTextMessage?.text || 
             data.message.imageMessage?.caption || 
             data.message.videoMessage?.caption || 
             '';
    }

    if (text) {
      try {
        const db = await readDB();
        // Find student with matching phone number
        const matchedStudent = db.alunos.find((a: any) => numbersMatch(a.whatsapp, senderNumber));
        
        if (matchedStudent) {
          const nowIso = new Date().toISOString();
          const newMsg = {
            id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            alunoId: matchedStudent.id,
            // If fromMe is true, it is agent message. If false, student message
            tipo: fromMe ? 'HUMANO_AGENTE' : 'HUMANO_CLIENTE',
            texto: text,
            dataHora: nowIso,
            statusEnvio: 'ENTREGUE'
          };

          db.mensagens.push(newMsg);

          // Append to activity logs
          const logTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
          const newLog = {
            id: `log-${Date.now()}`,
            timestamp: logTime,
            tipo: 'WHATSAPP',
            usuario: fromMe ? 'Atendente / API' : 'Estudante (WhatsApp)',
            detalhe: fromMe 
              ? `Mensagem enviada via WhatsApp para ${matchedStudent.nome}.`
              : `Nova mensagem recebida de ${matchedStudent.nome}: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
            sucesso: true
          };
          db.logs.unshift(newLog);
          
          await writeDB(db);
          console.log(`[Sentidos Webhook] Saved message from ${matchedStudent.nome} to database`);
        } else {
          console.log(`[Sentidos Webhook] Received message from unknown JID: ${senderNumber} ("${text}")`);
        }
      } catch (err) {
        console.error('[Sentidos Webhook] Error processing webhook message:', err);
      }
    }
  }

  // Always return 200 OK to the Evolution API
  res.json({ success: true });
});

// Clean database for production (keep regras, crmConfig, and polos)
app.post('/api/clear-db', async (_req, res) => {
  console.log('[Sentidos Cobranças] Recebida requisição /api/clear-db. Limpando dados de alunos, parcelas e mensagens para produção...');
  // Ajuste F7: sem backup válido, a operação não prossegue.
  if (!backupDatabaseFile()) {
    return res.status(500).json({ success: false, error: 'Backup de segurança falhou. Operação de limpeza abortada para evitar perda de dados.' });
  }
  try {
    const db = await readDB();
    db.alunos = [];
    db.parcelas = [];
    db.parcelaHistorico = [];
    db.mensagens = [];
    db.logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        tipo: 'USUARIO',
        usuario: 'Sistema',
        detalhe: 'Banco de dados limpo para início de produção com dados reais.',
        sucesso: true
      }
    ];
    await writeDB(db);
    res.json({ success: true, message: 'Banco de dados limpo com sucesso para produção!', data: db });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve React frontend static files in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  // Fallback to index.html for React SPA routing
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`[Sentidos Cobranças] Servindo arquivos estáticos de: ${distPath}`);
}

// ─── Disparo Agendado (Scheduler) ───────────────────────────────────────────

function parseDateBR(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m, d);
}

function buildMsgScheduler(template: string, aluno: any, parcela: any): string {
  const num = String(parcela.numeroParcela).padStart(2, '0');
  const tot = String(parcela.totalParcelas).padStart(2, '0');
  return template
    .replace(/{nome_aluno}/g, aluno.nome)
    .replace(/{curso}/g, aluno.curso)
    .replace(/{valor_boleto}/g, `R$ ${Number(parcela.valorAtual).toFixed(2)}`)
    .replace(/{valor}/g, `R$ ${Number(parcela.valorAtual).toFixed(2)}`)
    .replace(/{vencimento_boleto}/g, parcela.vencimento)
    .replace(/{vencimento}/g, parcela.vencimento)
    .replace(/{parcela}/g, `${num}/${tot}`)
    .replace(/{linha_digitavel}/g, parcela.linhaDigitavel || parcela.linha_digitavel || "00190.00009 02738.162006 12345.678901 8 99830000045000")
    .replace(/{competencia}/g, parcela.competencia || "")
    .replace(/{link_pdf}/g, parcela.pdfPath || parcela.pdf_path || "http://siscobra.isentidos.net.br/boletos/exemplo.pdf");
}

function sanitizePhoneScheduler(numStr: string): string {
  const cleaned = (numStr || '').replace(/\D/g, '');
  if (cleaned.length >= 10 && cleaned.length <= 11 && !cleaned.startsWith('55')) {
    return '55' + cleaned;
  }
  return cleaned;
}

async function runScheduledDispatch(): Promise<void> {
  try {
    const db = await readDB();
    const gs = (db as any).globalSettings || {};
    const sd = gs.scheduledDispatch;
    if (!sd?.enabled) return;
    try {
      getEvolutionConfig(db);
    } catch {
      console.warn('[Agendador] Evolution API nao configurada no banco. Disparo agendado ignorado.');
      return;
    }

    // Horário de Brasília (UTC-3)
    const nowUtc = new Date();
    const brazilMs = nowUtc.getTime() - 3 * 60 * 60 * 1000;
    const brazilNow = new Date(brazilMs);
    const hh = String(brazilNow.getUTCHours()).padStart(2, '0');
    const mm = String(brazilNow.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;
    const currentMinutes = Number(hh) * 60 + Number(mm);
    const currentDay = brazilNow.getUTCDay(); // 0=Dom

    if (!(sd.diasSemana as number[]).includes(currentDay)) return;

    const todayKey = `${brazilNow.getUTCFullYear()}-${String(brazilNow.getUTCMonth() + 1).padStart(2, '0')}-${String(brazilNow.getUTCDate()).padStart(2, '0')}`;
    const alreadyRun: Record<string, string> = sd.ultimoDisparoPorRegra || {};
    const toMinutes = (time: string) => {
      const [hRaw, mRaw] = String(time || '09:00').split(':');
      return (Number(hRaw) || 0) * 60 + (Number(mRaw) || 0);
    };

    const rulesToRun = db.regras.filter((r: any) => {
      if (!r.ativo) return false;
      const ruleTime = r.horarioEnvio || sd.horario || '09:00';
      return currentMinutes >= toMinutes(ruleTime) && alreadyRun[r.id] !== todayKey;
    });
    if (rulesToRun.length === 0) return;

    console.log(`[Agendador] Iniciando disparo agendado às ${currentTime} (horário de Brasília) para ${rulesToRun.length} regra(s)...`);

    const today = new Date(
      brazilNow.getUTCFullYear(),
      brazilNow.getUTCMonth(),
      brazilNow.getUTCDate()
    );

    let enviadas = 0;
    const erros: string[] = [];
    const dbParcelas: any[] = db.parcelas;
    const minSec = Number(gs.dispatchMinIntervalSec ?? 15);
    const maxSec = Number(gs.dispatchMaxIntervalSec ?? 45);

    for (const regra of rulesToRun) {
      if (!regra.ativo) continue;
      const canal = regra.canal || 'WHATSAPP';
      if (canal !== 'WHATSAPP' && canal !== 'EMAIL' && canal !== 'AMBOS') continue;

      for (let pi = 0; pi < dbParcelas.length; pi++) {
        const parcela = dbParcelas[pi];
        if (parcela.status !== 'PENDENTE' && parcela.status !== 'ATRASADO') continue;

        const aluno = (db.alunos as any[]).find((a: any) => a.id === parcela.alunoId);
        if (!aluno || aluno.cobrancaAutomatica === false) continue;

        // Avalia se a régua se aplica hoje
        const vencDate = parseDateBR(parcela.vencimento);
        if (!vencDate) continue;
        const diffDias = Math.round((vencDate.getTime() - today.getTime()) / 86400000);
        const absDias = Math.abs(Number(regra.diasGatilho));

        let matches = false;
        if (regra.tipoGatilho === 'ANTES' && diffDias === absDias) matches = true;
        if (regra.tipoGatilho === 'DIA_VENCIMENTO' && diffDias === 0) matches = true;
        if (regra.tipoGatilho === 'DEPOIS' && diffDias === -absDias) matches = true;
        if (!matches) continue;

        // Anti-duplicidade: não enviar mais de uma vez por dia para a mesma parcela
        if (parcela.ultimoEnvio) {
          const lastMs = new Date(parcela.ultimoEnvio).getTime();
          if ((nowUtc.getTime() - lastMs) < 23 * 3600 * 1000) continue;
        }

        const texto = buildMsgScheduler(regra.mensagemTemplate, aluno, parcela);
        const phone = sanitizePhoneScheduler(aluno.whatsapp);

        let enviouNesteCiclo = false;

        // Envio de E-mail
        if ((canal === 'EMAIL' || canal === 'AMBOS') && aluno.email && db.smtpConfig && db.smtpConfig.active) {
          try {
            const transporter = nodemailer.createTransport({
              host: db.smtpConfig.host,
              port: Number(db.smtpConfig.port),
              secure: db.smtpConfig.secure ?? false,
              auth: {
                user: db.smtpConfig.user,
                pass: db.smtpConfig.pass
              }
            });
            await transporter.sendMail({
              from: `"${db.smtpConfig.fromName || 'Instituto Sentidos'}" <${db.smtpConfig.fromEmail}>`,
              to: aluno.email,
              subject: `Aviso: ${regra.titulo} (Instituto Sentidos)`,
              text: texto.replace(/<[^>]*>/g, ''),
              html: `<p style="white-space: pre-wrap; font-family: sans-serif;">${texto}</p>`
            });
            enviouNesteCiclo = true;
          } catch (err: any) {
            erros.push(`${aluno.nome} (E-mail): ${err.message}`);
          }
        }

        // Envio de WhatsApp
        if (canal === 'WHATSAPP' || canal === 'AMBOS') {
          try {
            await sendEvolutionText(db, phone, texto);
            enviouNesteCiclo = true;
          } catch (err: any) {
            erros.push(`${aluno.nome} (WhatsApp): ${err.message}`);
          }
        }

        if (enviouNesteCiclo) {
          enviadas++;
          const nowIso = nowUtc.toISOString();
          dbParcelas[pi] = {
            ...dbParcelas[pi],
            enviadoWhatsAppCount: (dbParcelas[pi].enviadoWhatsAppCount || 0) + 1,
            ultimoEnvio: nowIso,
            atualizadoEm: nowIso
          };
        }

        // Delay anti-ban entre envios
        await new Promise(r => setTimeout(r, randomDelayMs(minSec, maxSec)));
      }
      alreadyRun[regra.id] = todayKey;
    }

    const dataFmt = brazilNow.toLocaleDateString('pt-BR');
    const resultado = `${enviadas} mensagem(ns) enviada(s) em ${dataFmt}${erros.length ? ` | ${erros.length} erro(s): ${erros.slice(0, 3).join('; ')}` : ''}`;

    (db as any).globalSettings = {
      ...gs,
      scheduledDispatch: {
        ...sd,
        ultimoDisparo: nowUtc.toISOString(),
        ultimoResultado: resultado,
        ultimoDisparoPorRegra: alreadyRun
      }
    };
    db.parcelas = dbParcelas;

    const logTimestamp = nowUtc.toISOString().replace('T', ' ').substring(0, 19);
    db.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: logTimestamp,
      tipo: 'SISTEMA',
      usuario: 'Agendador',
      detalhe: `Disparo agendado: ${resultado}`,
      sucesso: erros.length === 0
    } as any);

    await writeDB(db as any);
    console.log(`[Agendador] ${resultado}`);

  } catch (err: any) {
    console.error('[Agendador] Erro no disparo agendado:', err.message || err);
  }
}

// ─── Initialize Database then Start Server ───────────────────────────────────

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`[Sentidos Cobranças] Servidor rodando na porta ${PORT}`);
  });

  // Verificar a cada 60 segundos se é hora do disparo agendado
  setInterval(runScheduledDispatch, 60 * 1000);
  console.log('[Agendador] Scheduler iniciado (verificação a cada 60s).');

}).catch(err => {
  console.error('[Sentidos Cobranças] Erro catastrófico ao inicializar o banco de dados:', err);
  process.exit(1);
});
