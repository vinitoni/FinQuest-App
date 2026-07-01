# FinQuest

**Plataforma de educação financeira gamificada.** Simulador de investimentos com ativos reais da B3, trilhas de aprendizagem por níveis, competições entre usuários e uma IA tutora - para quem quer aprender a investir praticando, sem arriscar dinheiro de verdade.

- 🔗 **Aplicação em produção:** https://finquest-app-omega.vercel.app
- 💻 **Código-fonte da aplicação:** [`app/`](app/) - ver [README técnico](app/README.md) para instruções de execução local
- 🎓 **Projeto de Portfólio (TCC)** - Católica SC, linha Web Apps

---

## Acesso de teste

Não é necessário ter uma conta - o cadastro é gratuito e instantâneo (recebe R$100.000 virtuais na hora). Para avaliação rápida, também há uma conta demo pronta:

| Campo | Valor |
|---|---|
| URL | https://finquest-app-omega.vercel.app/login |
| E-mail | `demo@finquest.com` |
| Senha | `demo123` |

> A conta demo já possui carteira, XP e histórico de operações para visualização imediata do dashboard, ranking e simulador.

---

## O problema

Brasileiros querem investir, mas a maioria não se sente segura: falta de educação financeira prática, medo de perder dinheiro real testando, e conteúdo de investimentos que é ou raso demais (gurus, dicas soltas) ou técnico demais (relatórios, jargão de mercado). O resultado é gente que fica fora do mercado ou investe no escuro.

## A solução

FinQuest junta três coisas que normalmente vêm separadas: **simulação com dados reais**, **conteúdo estruturado por nível** e **gamificação** que dá feedback imediato - para que o usuário aprenda *fazendo*, com risco zero.

---

## Funcionalidades

| Módulo | O que faz |
|---|---|
| **Simulador** | Carteira virtual de R$100.000, compra/venda de ações reais da B3 (inteiro e fracionário), cotações ao vivo (Yahoo Finance), explicações contextuais sobre tickers e operações. |
| **Academy** | Trilha de cursos por nível (iniciante → avançado), módulos com quiz interativo, progresso persistido por usuário. |
| **Duelo de Carteiras** | Competição multiplayer: dois usuários abrem carteiras independentes de R$100k e disputam, em tempo real, quem valoriza mais em um período (15min a 1 semana). |
| **Ranking Global** | Leaderboard ao vivo por patrimônio total, atualizado a cada refresh de cotação. |
| **Finny (IA)** | Tutora financeira via Claude (Anthropic), responde dúvidas sobre renda fixa, ações, FIIs, Tesouro Direto, CDI/SELIC etc. |
| **Radar de Mercado** | Feed de notícias financeiras (InfoMoney, Exame, G1) com análise de sentimento (alta/baixa) e watchlist de ativos. |
| **Calculadoras** | Juros compostos, aposentadoria e dividendos, com dados macroeconômicos reais (CDI, SELIC, IPCA). |
| **Painel Admin** | Gestão de cursos da Academy, eventos de mercado simulados e visão de usuários cadastrados. |

Isso cobre, com folga, os **três fluxos de negócio completos** exigidos para a linha Web Apps: autenticação + simulação de carteira, trilha de aprendizagem com progresso, e competição multiplayer.

---
## Capturas de Tela

**Mobile**

<p align="center">
  <img width="110" height="210" alt="dashboard" src="https://github.com/user-attachments/assets/83381a2e-3c3c-42d3-8b10-5244afa61405" />
  <img width="110" height="210" alt="simulador" src="https://github.com/user-attachments/assets/c927e874-2194-4a3f-a836-55c53f040618" />
  <img width="110" height="210" alt="ranking" src="https://github.com/user-attachments/assets/ba35e2bf-0e5f-4a12-bfb1-b061b4ba8ee1" />
  <img width="110" height="210" alt="duelo" src="https://github.com/user-attachments/assets/8411d15c-9f61-439c-a431-b7b1341d12ca" />
  <img width="110" height="210" alt="academy" src="https://github.com/user-attachments/assets/d5294b7d-aac9-4f78-80c4-64804fcb2342" />
  <img width="110" height="210" alt="finny" src="https://github.com/user-attachments/assets/fabccd52-e3d2-44e5-84f3-48ec6ee1d70a" />
</p>

**Web**

<p align="center">
  <img width="330"  alt="image" src="https://github.com/user-attachments/assets/dae10b1a-9b5d-4498-8e90-b608373832d4" />
  <img width="330"  alt="image" src="https://github.com/user-attachments/assets/a7e4d998-601d-48d0-ba9a-19c0dc53d5ec" />
  <img width="330"  alt="image" src="https://github.com/user-attachments/assets/c05b1399-0923-44dd-aaea-7bf60edcacf3" />
  <img width="330"  alt="image" src="https://github.com/user-attachments/assets/64283f20-e524-4444-85b4-4a3d3abbc868" />
  <img width="330"  alt="image" src="https://github.com/user-attachments/assets/b5ecfd5c-8274-43e0-848c-49165cc8e764" />
</p>
  

## Vídeo de Demonstração

<p align="center">
  <a href="https://www.youtube.com/watch?v=1B0Rp8hHM2Q">
    <img src="https://img.youtube.com/vi/1B0Rp8hHM2Q/maxresdefault.jpg" width="560" alt="Assistir demonstração do FinQuest" />
  </a>
</p>

<p align="center"><a href="https://www.youtube.com/watch?v=1B0Rp8hHM2Q">▶ Assistir no YouTube (7min)</a></p>

## Arquitetura

```
┌─────────────────────────────┐
│   Frontend (React + Vite)   │  → SPA hospedada na Vercel
│   app/src/pages, components,│
│   hooks, lib                │
└──────────────┬──────────────┘
               │ fetch
               ▼
┌─────────────────────────────┐
│  Backend (Vercel Functions) │  → app/api/*.js - serverless, Node runtime
│  stocks · macro · news      │     proxy + lógica própria, esconde
│  ai · admin-update          │     chaves de API do client
└──────────────┬──────────────┘
               │
        ┌──────┴───────┬─────────────┬──────────────┐
        ▼               ▼             ▼              ▼
   Yahoo Finance   HG Brasil API   Anthropic API   Supabase
   (cotações B3)   (macro/câmbio)  (Finny / IA)    (auth + Postgres + RLS)
```

**Justificativa técnica da stack** (em relação às diretrizes da linha Web Apps sobre Vercel/Supabase "sem gestão de arquitetura"):
- O backend **não é apenas hospedagem estática**: [`app/api/`](app/api) contém funções serverless desenvolvidas pelo autor que fazem proxy autenticado a três APIs externas, escondem chaves secretas do client (`ANTHROPIC_API_KEY`, `HG_BRASIL_KEY`, `ADMIN_SECRET`) e implementam lógica própria - fallback de cotações entre hosts do Yahoo, análise de sentimento de notícias por palavras-chave, validação de admin por token Bearer.
- O Supabase é usado como **Postgres gerenciado com Row Level Security desenhada pelo autor** (ver [`app/SUPABASE_SETUP.md`](app/SUPABASE_SETUP.md) e [`app/supabase_duels.sql`](app/supabase_duels.sql)) - schema, políticas de acesso por usuário e funções de domínio (duelos, progresso, trades) são autorais, não geradas automaticamente por ferramenta no-code.
- Não há uso de builders visuais, backend automático sem controle de schema, nem deploy via SSH/FTP - o pipeline é Git push → build Vite → deploy Vercel, com [`app/vercel.json`](app/vercel.json) controlando rewrites.

### Camadas (frontend)

```
app/src/
├── App.jsx              # estado raiz, sessão, roteamento, regras de negócio (compra/venda, XP)
├── pages/                # uma tela por arquivo (Landing, Dash, Sim, Academy, Duel, Rank, AI, News, Calc, Profile, Auth)
├── components/           # AppShell (navegação), Modal, Toast, ChartTip, OnboardingTutorial
├── admin/AdminPanel.jsx  # painel administrativo
├── hooks/                # useMarket (cotações), useMacro (CDI/SELIC/IPCA), useSecretAdmin
├── data/                 # catálogo de ações, cursos, eventos de mercado
├── lib/                  # format.js (formatação), userData.js (sync Supabase ⇄ localStorage)
└── supabase.js           # client Supabase
```

### Modelo de dados (Supabase / Postgres)

| Tabela | Função |
|---|---|
| `profiles` | Perfil do usuário: nome, XP, saldo, patrimônio total |
| `portfolio` | Posições da carteira principal (ticker, quantidade, preço médio) |
| `trades` | Histórico de ordens de compra/venda |
| `progress` | Módulos da Academy concluídos por usuário |
| `duels` | Duelos de carteira: estado, participantes, carteiras independentes, prazo |

Todas as tabelas têm **Row Level Security** ativada - cada usuário só lê/escreve seus próprios dados. Detalhes e SQL completo em [`app/SUPABASE_SETUP.md`](app/SUPABASE_SETUP.md).

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, Vite 5, React Router 7, Recharts |
| Backend | Vercel Serverless Functions (Node.js) |
| Banco de dados | Supabase (PostgreSQL gerenciado + Row Level Security) |
| Autenticação | Supabase Auth (e-mail/senha) |
| IA | Anthropic Claude (API) |
| Dados de mercado | Yahoo Finance (cotações B3), HG Brasil (macro/câmbio) |
| Deploy | Vercel (CI/CD automático via push no GitHub) |

---

## Rodando localmente

```bash
cd app
npm install
```

Crie um arquivo `app/.env.local`:
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Configure o banco seguindo [`app/SUPABASE_SETUP.md`](app/SUPABASE_SETUP.md), depois:

```bash
npm run dev
```

Acesse `http://localhost:5173`. Instruções completas e detalhes de deploy em [`app/README.md`](app/README.md).

---

## Segurança e conformidade

- **Chaves de API nunca expostas no client** - `ANTHROPIC_API_KEY`, `HG_BRASIL_KEY` e `ADMIN_SECRET` vivem só no ambiente serverless da Vercel; o frontend chama `/api/*`, nunca a API externa diretamente.
- **Row Level Security** no Supabase: cada usuário só acessa seus próprios registros de carteira, trades e progresso.
- **`.env.local` fora do controle de versão** (`.gitignore` na raiz do repositório).
- **LGPD**: dados coletados (nome, e-mail) são mínimos e necessários à autenticação; sem coleta de dados sensíveis.
- Autenticação via Supabase Auth (e-mail/senha), com fluxo de recuperação de senha.

---

## Documentação completa

- [`app/README.md`](app/README.md) - guia técnico de execução e deploy
- [`app/SUPABASE_SETUP.md`](app/SUPABASE_SETUP.md) - schema do banco e políticas de segurança
- [`saidas/tcc/DOCUMENTACAO.md`](saidas/tcc/DOCUMENTACAO.md) - documentação acadêmica (requisitos, arquitetura, decisões técnicas)
- [Wiki do repositório](../../wiki) - documentação complementar

---

## Sobre o projeto

FinQuest é o projeto de Portfólio (TCC) desenvolvido individualmente para a Católica SC, linha **Web Apps**.

**Autor:** Vinícius - [vinitonii@gmail.com](mailto:vinitonii@gmail.com)
