import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readDB, writeDB, initDb, getInitialData } from './database';

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
        boletos: db.boletos.length,
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
app.post('/api/reset', async (req, res) => {
  console.log('[Sentidos Cobranças] Recebida requisição /api/reset. Reiniciando banco de dados para os valores padrão...');
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
  const required = ['alunos', 'boletos', 'mensagens', 'regras', 'crmConfig', 'logs', 'polos', 'users'];
  const hasRequired = required.every(key => key in data);
  if (!hasRequired) {
    return res.status(400).json({ success: false, message: 'Dados incompletos para persistência' });
  }
  console.log(`[Sentidos Cobranças] Recebida requisição /api/save-all. Salvando ${data.alunos.length} alunos, ${data.boletos.length} boletos...`);
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

// Boletos CRUD
app.get('/api/boletos', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.boletos);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/boletos', async (req, res) => {
  try {
    const db = await readDB();
    const novoBoleto = req.body;
    const idx = db.boletos.findIndex((b: any) => b.id === novoBoleto.id);
    if (idx > -1) {
      db.boletos[idx] = novoBoleto;
    } else {
      db.boletos.push(novoBoleto);
    }
    await writeDB(db);
    res.json({ success: true, data: novoBoleto });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/boletos/:id', async (req, res) => {
  try {
    const db = await readDB();
    const id = req.params.id;
    const idx = db.boletos.findIndex((b: any) => b.id === id);
    if (idx > -1) {
      db.boletos[idx] = { ...db.boletos[idx], ...req.body };
      await writeDB(db);
      res.json({ success: true, data: db.boletos[idx] });
    } else {
      res.status(404).json({ success: false, message: 'Boleto não encontrado' });
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
app.post('/api/clear-db', async (req, res) => {
  console.log('[Sentidos Cobranças] Recebida requisição /api/clear-db. Limpando dados de alunos, boletos e mensagens para produção...');
  try {
    const db = await readDB();
    db.alunos = [];
    db.boletos = [];
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
