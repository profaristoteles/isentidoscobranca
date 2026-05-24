# PRD — Sistema de Cobrança Automatizada
## Instituto Sentidos + FAEPI

---

# 1. Visão Geral do Produto

## Nome do Sistema
**Sentidos Cobranças**

## Objetivo

Desenvolver uma plataforma de cobrança automatizada para o Instituto Sentidos, responsável pela gestão financeira e operacional das cobranças acadêmicas vinculadas à parceria com a FAEPI.

O sistema deverá automatizar:

- envio de lembretes;
- cobrança de inadimplentes;
- envio de boletos via WhatsApp;
- organização de boletos;
- OCR e leitura inteligente de PDFs;
- controle financeiro;
- integração com CRM;
- atendimento automatizado.

---

# 2. Problema Atual

## Cenário Operacional Atual

Atualmente:

1. O boleto é emitido manualmente no Sistema EduK;
2. O aluno solicita boleto via WhatsApp;
3. Um colaborador:
   - acessa o sistema;
   - procura o boleto;
   - baixa o PDF;
   - envia manualmente;
4. Não existe automação de cobrança;
5. Não existe régua automática;
6. Não existe painel de inadimplência;
7. Não existe centralização operacional.

---

# 3. Contexto Técnico da FAEPI / Sistema EduK

## Ambiente Utilizado

A FAEPI utiliza o sistema:

https://sistemaeduk.com.br

---

## Limitações Técnicas

O sistema:

- não possui API pública;
- não disponibiliza endpoints;
- não possui documentação aberta;
- exige autorização institucional;
- não permitirá integração oficial.

---

## Decisão Arquitetural

O sistema será baseado em:

# Modelo Semi-Automatizado

Onde:
- os boletos serão baixados manualmente;
- o Sentidos Cobranças fará:
  - leitura;
  - indexação;
  - organização;
  - cobrança;
  - automação;
  - envio via WhatsApp.

---

# 4. Objetivos do Sistema

# Objetivos Operacionais

- reduzir trabalho manual;
- automatizar envio de boletos;
- centralizar cobranças;
- melhorar atendimento.

---

# Objetivos Financeiros

- reduzir inadimplência;
- aumentar recuperação financeira;
- acelerar cobranças;
- criar previsibilidade financeira.

---

# Objetivos Estratégicos

- transformar WhatsApp em canal financeiro;
- construir histórico financeiro do aluno;
- permitir escalabilidade operacional.

---

# 5. Stack Tecnológica

# Backend

- Node.js
- TypeScript
- NestJS

---

# Frontend

- Next.js
- TailwindCSS
- Shadcn/UI

---

# Banco de Dados

- PostgreSQL

---

# Infraestrutura

- Docker
- Docker Compose
- Portainer
- Traefik
- VPS Hetzner

---

# Filas e Processamento

- Redis
- BullMQ

---

# Integrações

## WhatsApp

https://doc.evolution-api.com/v2/pt/get-started/introduction

---

## CRM

https://help.leadconnectorhq.com/support/solutions/articles/155000002774-private-integrations-everything-you-need-to-know

---

# 6. Arquitetura Geral

```text
Sistema EduK
↓
Download manual dos boletos
↓
Upload no Sentidos Cobranças
↓
OCR + Parser Financeiro
↓
Banco PostgreSQL
↓
Motor de Cobrança
↓
WhatsApp Automation
↓
Aluno
```

---

# 7. Módulos do Sistema

# 7.1 Gestão de Alunos

## Funcionalidades

- cadastro manual;
- importação CSV;
- sincronização CRM;
- edição;
- histórico financeiro.

---

## Campos

```text
Nome
CPF
WhatsApp
Curso
Matrícula
Status
Polo
Data vencimento
Valor mensalidade
```

---

# 7.2 Gestão de Boletos

## Funcionalidades

- upload manual;
- upload em lote;
- OCR automático;
- parser financeiro;
- associação automática ao aluno;
- armazenamento;
- envio automatizado.

---

# Estrutura de Upload

```text
/importar-boletos
```

---

# Organização dos Arquivos

```text
/boletos
   /2026
      /05
         /curso
            aluno.pdf
```

---

# 7.3 OCR e Parser Financeiro

# Objetivo

Ler automaticamente os boletos emitidos pela FAEPI.

---

# Dados Extraídos

O sistema deverá identificar:

```json
{
  "nome_aluno": "",
  "cpf": "",
  "matricula": "",
  "curso": "",
  "competencia": "",
  "valor": "",
  "vencimento": "",
  "linha_digitavel": "",
  "nosso_numero": ""
}
```

---

# Bibliotecas Recomendadas

## PDFs

- pdf-parse
- pdf-lib
- pdfjs

---

## OCR

- tesseract.js

---

# Estratégia de Leitura

## Etapa 1

Extração textual direta do PDF.

---

## Etapa 2

Fallback OCR caso PDF seja imagem.

---

# Regex Recomendadas

## CPF

```regex
\d{3}\.\d{3}\.\d{3}-\d{2}
```

---

## Matrícula

```regex
Matricula:\s*(\d+)
```

---

## Linha digitável

```regex
(\d{5}\.\d{5}\s\d{5}\.\d{6}\s\d{5}\.\d{6}\s\d\s\d{14})
```

---

# 7.4 Motor de Cobrança

# Funcionalidades

- lembretes automáticos;
- régua de cobrança;
- envio de boleto;
- renegociação;
- atualização de status.

---

# Régua de Cobrança

## Pré-vencimento

| Momento | Ação |
|---|---|
| 7 dias antes | lembrete amigável |
| 3 dias antes | reforço |
| 1 dia antes | aviso final |

---

## Pós-vencimento

| Momento | Ação |
|---|---|
| 1 dia | aviso leve |
| 5 dias | cobrança moderada |
| 15 dias | negociação |
| 30 dias | alerta administrativo |

---

# 7.5 WhatsApp Automation

# Integração

Via Evolution API.

---

# Fluxo Inicial

```text
Olá, Nome 👋

1️⃣ Segunda via de boleto
2️⃣ Consultar débitos
3️⃣ Negociar mensalidade
4️⃣ Atendimento humano
```

---

# Fluxo Segunda Via

```text
Aluno solicita boleto
↓
Sistema solicita CPF
↓
Sistema localiza boleto
↓
Sistema envia:
- PDF
- linha digitável
- vencimento
- valor
```

---

# 7.6 Dashboard Financeiro

# Indicadores

- total recebido;
- total em aberto;
- inadimplência;
- boletos vencidos;
- cobranças enviadas;
- recuperação financeira;
- inadimplência por curso;
- inadimplência por polo.

---

# 7.7 Atendimento Humano

# Funcionalidades

- assumir conversa;
- pausar automação;
- histórico completo;
- registrar negociação.

---

# 7.8 CRM Sync

# Objetivos

Sincronizar informações com LeadConnector.

---

# Funcionalidades

- atualizar tags;
- criar oportunidades;
- atualizar pipeline;
- registrar inadimplência;
- registrar pagamento.

---

# 8. Banco de Dados

# Tabelas Principais

```text
users
students
boletos
payments
messages
automations
negotiations
crm_logs
```

---

# Estrutura Tabela Boletos

```sql
CREATE TABLE boletos (
  id UUID PRIMARY KEY,
  aluno_id UUID,
  matricula VARCHAR(50),
  competencia VARCHAR(20),
  vencimento DATE,
  valor NUMERIC(10,2),
  linha_digitavel TEXT,
  nosso_numero VARCHAR(100),
  status VARCHAR(30),
  pdf_path TEXT,
  hash_arquivo TEXT,
  criado_em TIMESTAMP
);
```

---

# 9. Regras de Negócio

# Associação de Alunos

## Prioridade

1. CPF
2. Matrícula
3. Nome

---

# Prevenção de Duplicidade

O sistema deverá validar:

- linha digitável;
- nosso número;
- hash SHA256 do PDF.

---

# Regras Financeiras

## Multa

```text
2% após vencimento
```

---

## Juros

```text
1% ao mês
```

---

## Mora diária

```text
R$ 0,04 por dia
```

---

# 10. Infraestrutura

# Containers Docker

```yaml
- traefik
- postgres
- redis
- backend
- frontend
- worker
- evolution-api
```

---

# Domínios

```text
api.cobranca.isentidos.com.br
app.cobranca.isentidos.com.br
```

---

# SSL

Gerenciado via Traefik.

---

# 11. Estrutura de Projeto

```text
/apps
  /api
  /web

/services
  /billing-engine
  /ocr-engine
  /whatsapp-engine
  /crm-sync
  /notifications

/packages
  /database
  /core
```

---

# 12. Segurança

# Requisitos

- HTTPS;
- JWT;
- RBAC;
- criptografia;
- LGPD;
- logs estruturados.

---

# 13. Roadmap

# MVP — Fase 1

## Prioridade Máxima

- upload de boletos;
- OCR;
- parser;
- WhatsApp automático;
- régua de cobrança;
- dashboard financeiro.

---

# Fase 2

- CRM Sync;
- negociação automatizada;
- portal financeiro do aluno;
- analytics.

---

# Fase 3

- IA cobradora;
- PIX automático;
- app mobile;
- previsões financeiras.

---

# 14. Fluxo Operacional Completo

```text
Equipe baixa boletos no EduK
↓
Upload em lote
↓
OCR interpreta boletos
↓
Sistema vincula aluno
↓
Sistema agenda cobranças
↓
WhatsApp envia lembretes
↓
Aluno solicita segunda via
↓
Sistema envia automaticamente
↓
Equipe acompanha dashboard
```

---

# 15. Oportunidades Futuras

# Portal Financeiro do Aluno

Permitir:
- consultar débitos;
- baixar boletos;
- histórico financeiro;
- renegociação.

---

# Inteligência Artificial

## Possibilidades

- análise de inadimplência;
- previsão de evasão;
- IA cobradora;
- negociação automatizada.

---

# 16. Benefícios Esperados

# Operacionais

- redução drástica do trabalho manual;
- centralização financeira;
- automação de atendimento.

---

# Financeiros

- redução da inadimplência;
- aumento da recuperação;
- maior previsibilidade.

---

# Estratégicos

- escalabilidade;
- independência operacional;
- padronização das cobranças.