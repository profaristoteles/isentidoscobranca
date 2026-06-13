import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { readDB, writeDB, initDb, getInitialData, backupDatabaseFile } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());

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

// Login verification
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const db = await readDB();
    const matchedUser = db.users?.find((u: any) => u.email === email && u.password === password);

    if (matchedUser) {
      return res.json({ 
        success: true, 
        message: 'Autenticado com sucesso!', 
        user: { email: matchedUser.email, name: matchedUser.name, role: matchedUser.role },
        token: `demo-token-${Date.now()}`
      });
    }

    if (email === 'isentidosedu@gmail.com' && password === 'sentidos123') {
      return res.json({ 
        success: true, 
        message: 'Autenticado com sucesso!', 
        user: { email, role: 'Administrador' },
        token: `demo-token-${Date.now()}`
      });
    }

    return res.status(401).json({ success: false, message: 'Credenciais inválidas para o painel FAEPI.' });
  } catch (err: any) {
    console.error('Error during login:', err);
    return res.status(500).json({ success: false, message: 'Erro interno ao autenticar usuário.' });
  }
});

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
    const fetchResponse = await fetch(url, {
      method: method || 'GET',
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

// Initialize Database then Start Server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`[Sentidos Cobranças] Servidor rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('[Sentidos Cobranças] Erro catastrófico ao inicializar o banco de dados:', err);
  process.exit(1);
});
