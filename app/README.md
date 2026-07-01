# FinQuest — Guia Técnico

> Visão geral do produto, funcionalidades e arquitetura: [README principal](../README.md).
> Este documento cobre **execução local, configuração e deploy**.

## Estrutura do projeto

```
app/
├── index.html            ← entrada do app
├── package.json           ← dependências
├── vite.config.js         ← configuração do build
├── vercel.json             ← rewrites de rota para SPA
├── api/                    ← backend serverless (Vercel Functions)
│   ├── stocks.js             cotações B3 (Yahoo Finance, com fallback de host)
│   ├── macro.js               CDI/SELIC/IPCA/câmbio (HG Brasil)
│   ├── news.js                 feed de notícias + análise de sentimento
│   ├── ai.js                    proxy seguro para a API da Anthropic (Finny)
│   └── admin-update.js           updates administrativos autenticados por token
├── src/
│   ├── App.jsx              ← estado raiz, sessão, roteamento, regras de negócio
│   ├── pages/                ← uma tela por arquivo
│   ├── components/            ← AppShell, Modal, Toast, ChartTip, OnboardingTutorial
│   ├── admin/AdminPanel.jsx    ← painel administrativo
│   ├── hooks/                   ← useMarket, useMacro, useSecretAdmin
│   ├── data/                     ← catálogo de ações, cursos, eventos
│   ├── lib/                       ← format.js, userData.js (sync Supabase ⇄ localStorage)
│   └── supabase.js                ← client Supabase
├── supabase_duels.sql      ← schema SQL do sistema de duelos
└── SUPABASE_SETUP.md       ← schema completo + políticas de RLS
```

---

## Pré-requisitos

- **Node.js 18+** → https://nodejs.org
- **Conta no Supabase** (gratuita) → https://supabase.com
- **Conta na Vercel** (gratuita, login com GitHub) → https://vercel.com

---

## Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o banco (Supabase)

Siga o passo a passo completo em [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md): cria as tabelas `profiles`, `portfolio`, `trades`, `progress` e `duels` (este último via [`supabase_duels.sql`](./supabase_duels.sql)), todas com Row Level Security.

### 3. Variáveis de ambiente

Crie `.env.local` na raiz de `app/`:
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> As funções em `api/` usam variáveis **server-side** (não prefixadas com `VITE_`), configuradas só na Vercel em produção:
> - `ANTHROPIC_API_KEY` — habilita a Finny (IA). Sem ela, a IA retorna mensagem de indisponibilidade, sem quebrar o app.
> - `HG_BRASIL_KEY` — dados macro em tempo real. Sem ela, usa valores padrão (`DEFAULTS` em `api/macro.js`).
> - `ADMIN_SECRET` — token do painel admin. Tem fallback de desenvolvimento no código, mas **deve ser sobrescrito em produção**.

### 4. Rodar

```bash
npm run dev
```

Abre em `http://localhost:5173`.

---

## Deploy (Vercel)

1. Suba o repositório para o GitHub (`git push`).
2. Em https://vercel.com → **Add New Project** → selecione o repositório, com **Root Directory = `app`**.
3. Framework detectado automaticamente: Vite (`npm run build`, output `dist/`).
4. Em **Settings → Environment Variables**, adicione: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `HG_BRASIL_KEY`, `ADMIN_SECRET`.
5. **Deploy**. Pushes subsequentes em `main` republicam automaticamente (CI/CD).

Produção atual: **https://finquest-app-omega.vercel.app**

---

## Cotações de mercado

O simulador busca preços reais da B3 via Yahoo Finance, através de `api/stocks.js` (sem precisar de chave — usa o endpoint público `/v8/finance/chart`, com fallback entre `query1` e `query2`).

- Atualiza ao abrir o app e a cada poucos minutos automaticamente (`useMarket`).
- Botão manual "🔄 Atualizar" no Dashboard e no Simulador.
- Se a API cair, exibe o último fechamento conhecido como fallback.

---

## Acesso de teste (avaliação)

Ver [README principal](../README.md#acesso-de-teste) para a conta demo e instruções de auto-cadastro.
