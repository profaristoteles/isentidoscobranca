import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'database.json');

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


// Helper function to read DB
const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(getInitialData());
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
      writeDB(parsed);
    }
    return parsed;
  } catch (error) {
    console.error("Error reading database file:", error);
    return getInitialData();
  }
};

// Helper function to write DB
const writeDB = (data: any) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing database file:", error);
  }
};

const getInitialData = () => {
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
};

// Login verification
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
  }

  const db = readDB();
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
});

// Status / Health check
app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', message: 'Backend do Sentidos Cobranças está rodando!', database: fs.existsSync(DB_PATH) ? 'conectado' : 'criado' });
});

// Get complete DB
app.get('/api/db', (req, res) => {
  res.json(readDB());
});

// Reset database
app.post('/api/reset', (req, res) => {
  console.log('[Sentidos Cobranças] Recebida requisição /api/reset. Reiniciando banco de dados para os valores padrão...');
  const initial = getInitialData();
  writeDB(initial);
  res.json({ success: true, message: 'Banco de dados reiniciado e limpo com sucesso!', data: initial });
});

// Save complete database state
app.post('/api/save-all', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: 'Dados inválidos' });
  }
  const required = ['alunos', 'boletos', 'mensagens', 'regras', 'crmConfig', 'logs', 'polos', 'users'];
  const hasRequired = required.every(key => key in data);
  if (!hasRequired) {
    return res.status(400).json({ success: false, message: 'Dados incompletos para persistência' });
  }
  console.log(`[Sentidos Cobranças] Recebida requisição /api/save-all. Salvando ${data.alunos.length} alunos, ${data.boletos.length} boletos no arquivo database.json...`);
  writeDB(data);
  res.json({ success: true, message: 'Banco de dados salvo com sucesso!' });
});

// Alunos CRUD
app.get('/api/alunos', (req, res) => {
  const db = readDB();
  res.json(db.alunos);
});

app.post('/api/alunos', (req, res) => {
  const db = readDB();
  const novoAluno = req.body;
  
  // check duplicate
  const idx = db.alunos.findIndex((a: any) => a.id === novoAluno.id);
  if (idx > -1) {
    db.alunos[idx] = novoAluno;
  } else {
    db.alunos.push(novoAluno);
  }
  
  writeDB(db);
  res.json({ success: true, data: novoAluno });
});

app.put('/api/alunos/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const idx = db.alunos.findIndex((a: any) => a.id === id);
  if (idx > -1) {
    db.alunos[idx] = { ...db.alunos[idx], ...req.body };
    writeDB(db);
    res.json({ success: true, data: db.alunos[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Aluno não encontrado' });
  }
});

// Boletos CRUD
app.get('/api/boletos', (req, res) => {
  const db = readDB();
  res.json(db.boletos);
});

app.post('/api/boletos', (req, res) => {
  const db = readDB();
  const novoBoleto = req.body;
  const idx = db.boletos.findIndex((b: any) => b.id === novoBoleto.id);
  if (idx > -1) {
    db.boletos[idx] = novoBoleto;
  } else {
    db.boletos.push(novoBoleto);
  }
  writeDB(db);
  res.json({ success: true, data: novoBoleto });
});

app.put('/api/boletos/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const idx = db.boletos.findIndex((b: any) => b.id === id);
  if (idx > -1) {
    db.boletos[idx] = { ...db.boletos[idx], ...req.body };
    writeDB(db);
    res.json({ success: true, data: db.boletos[idx] });
  } else {
    res.status(404).json({ success: false, message: 'Boleto não encontrado' });
  }
});

// Mensagens CRUD
app.get('/api/mensagens', (req, res) => {
  const db = readDB();
  res.json(db.mensagens);
});

app.post('/api/mensagens', (req, res) => {
  const db = readDB();
  const novaMsg = req.body;
  db.mensagens.push(novaMsg);
  writeDB(db);
  res.json({ success: true, data: novaMsg });
});

// Regras CRUD
app.get('/api/regras', (req, res) => {
  const db = readDB();
  res.json(db.regras);
});

app.post('/api/regras', (req, res) => {
  const db = readDB();
  const regras = req.body;
  if (Array.isArray(regras)) {
    db.regras = regras;
  } else {
    db.regras.push(regras);
  }
  writeDB(db);
  res.json({ success: true, data: db.regras });
});

// CRM Config CRUD
app.get('/api/crmConfig', (req, res) => {
  const db = readDB();
  res.json(db.crmConfig);
});

app.post('/api/crmConfig', (req, res) => {
  const db = readDB();
  db.crmConfig = req.body;
  writeDB(db);
  res.json({ success: true, data: db.crmConfig });
});

// Logs CRUD
app.get('/api/logs', (req, res) => {
  const db = readDB();
  res.json(db.logs);
});

app.post('/api/logs', (req, res) => {
  const db = readDB();
  const novoLog = req.body;
  db.logs.unshift(novoLog);
  writeDB(db);
  res.json({ success: true, data: novoLog });
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
app.post('/api/whatsapp/webhook', (req, res) => {
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
      const db = readDB();
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
        
        writeDB(db);
        console.log(`[Sentidos Webhook] Saved message from ${matchedStudent.nome} to database.json`);
      } else {
        console.log(`[Sentidos Webhook] Received message from unknown JID: ${senderNumber} ("${text}")`);
      }
    }
  }

  // Always return 200 OK to the Evolution API
  res.json({ success: true });
});

// Clean database for production (keep regras, crmConfig, and polos)
app.post('/api/clear-db', (req, res) => {
  console.log('[Sentidos Cobranças] Recebida requisição /api/clear-db. Limpando dados de alunos, boletos e mensagens para produção...');
  const db = readDB();
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
  writeDB(db);
  res.json({ success: true, message: 'Banco de dados limpo com sucesso para produção!', data: db });
});



// Serve React frontend static files in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback to index.html for React SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`[Sentidos Cobranças] Servindo arquivos estáticos de: ${distPath}`);
}

app.listen(PORT, () => {
  console.log(`[Sentidos Cobranças] Servidor rodando na porta ${PORT}`);
  console.log(`[Sentidos Cobranças] Banco de dados em arquivo: ${DB_PATH}`);
});
