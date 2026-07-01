# FinQuest - Documentação Técnica

> Projeto de Portfólio (TCC) - Católica SC, linha **Web Apps**
> Autor: Vinícius - vinitonii@gmail.com
> Repositório: https://github.com/vinitoni/FinQuest-App
> Aplicação em produção: https://finquest-app-omega.vercel.app

Este documento complementa o [README principal](README.md) com o detalhamento exigido pelas diretrizes da disciplina: contexto, requisitos, arquitetura, decisões técnicas e conformidade.

---

## 1. Contexto e Motivação

A maior parte dos brasileiros não investe - não por falta de dinheiro, mas por falta de confiança. Pesquisas recorrentes do setor financeiro apontam que o medo de perder dinheiro e a falta de conhecimento prático são as principais barreiras de entrada no mercado de capitais, mais até do que a falta de capital disponível.

O conteúdo educacional disponível hoje tende para dois extremos: superficial demais (dicas soltas de "gurus" em redes sociais, sem fundamentação) ou técnico demais (relatórios de corretoras, jargão de mercado), sem um meio-termo que ensine fazendo, em ambiente seguro.

**Problema central:** não existe um espaço de baixo risco onde uma pessoa leiga aprenda a operar no mercado financeiro real, com feedback prático e progressão guiada, antes de arriscar dinheiro próprio.

## 2. Objetivos

- Permitir que o usuário pratique decisões de investimento com ativos reais da B3, sem risco financeiro.
- Estruturar o aprendizado em trilhas progressivas (Academy), do básico ao avançado.
- Criar engajamento e retenção através de mecânicas de gamificação (XP, níveis, ranking, competição).
- Oferecer suporte sob demanda via IA tutora, reduzindo a barreira de "não saber o que perguntar".

## 3. Linha de Projeto e Enquadramento

**Linha:** Web Apps - aplicação web completa, interface navegável, arquitetura definida, deploy público (conforme [`directions/portfolio-directions-webapp.md`](https://github.com/CatolicaSC-Portfolio/The-Portfolio-Playbook/blob/main/directions/portfolio-directions-webapp.md) do Playbook).

> **Nota sobre enquadramento de tema:** o Playbook lista "Sistema de Gestão Financeira (com ou sem IA)" entre os temas impedidos, por ser tema recorrente. O FinQuest não é um sistema de *gestão financeira pessoal* (controle de gastos, orçamento, contas a pagar) - é uma **plataforma de educação financeira gamificada com simulação de mercado de capitais**, categoria distinta tanto em proposta (ensinar a investir, não administrar finanças do dia a dia) quanto em arquitetura (simulador com dados reais de bolsa, trilha de cursos, multiplayer). Essa distinção é detalhada na apresentação ao avaliador.

---

## 4. Requisitos Funcionais

| ID | Requisito | Status |
|---|---|---|
| RF01 | O sistema deve permitir cadastro e autenticação de usuários por e-mail/senha. | ✅ |
| RF02 | O sistema deve fornecer R$100.000 virtuais a cada novo usuário. | ✅ |
| RF03 | O usuário deve poder comprar e vender ações reais da B3 (lote inteiro e fracionário), com preços ao vivo. | ✅ |
| RF04 | O sistema deve persistir carteira, saldo e histórico de operações por usuário. | ✅ |
| RF05 | O sistema deve oferecer trilhas de cursos com módulos e quizzes, com progresso salvo por usuário. | ✅ |
| RF06 | O sistema deve calcular e exibir XP e nível do usuário com base em suas ações. | ✅ |
| RF07 | O sistema deve permitir duelos multiplayer: dois usuários competem por valorização percentual de carteiras independentes, em uma janela de tempo configurável. | ✅ |
| RF08 | O sistema deve exibir um ranking global por patrimônio total, atualizado em tempo real. | ✅ |
| RF09 | O sistema deve oferecer um assistente de IA (Finny) para dúvidas sobre investimentos. | ✅ |
| RF10 | O sistema deve exibir notícias financeiras com indicação de sentimento (alta/baixa). | ✅ |
| RF11 | O sistema deve oferecer calculadoras financeiras (juros compostos, aposentadoria, dividendos) com dados macroeconômicos reais. | ✅ |
| RF12 | O sistema deve oferecer um painel administrativo para gestão de conteúdo (cursos, eventos) e visão de usuários. | ✅ |
| RF13 | O sistema deve permitir recuperação de senha via e-mail. | ✅ |

## 5. Casos de Uso / User Stories

- **US01** - Como visitante, quero me cadastrar gratuitamente para começar a praticar investimentos sem risco.
- **US02** - Como usuário, quero comprar e vender ações com preços reais para entender como o mercado se move.
- **US03** - Como usuário iniciante, quero seguir uma trilha de cursos para aprender conceitos antes de operar.
- **US04** - Como usuário, quero desafiar outro usuário para um duelo de carteiras para testar minha estratégia contra alguém em tempo real.
- **US05** - Como usuário, quero ver minha posição no ranking global para me sentir motivado a continuar.
- **US06** - Como usuário com dúvida pontual, quero perguntar à Finny (IA) sobre um conceito financeiro sem sair do app.
- **US07** - Como administrador, quero gerenciar o conteúdo da Academy e visualizar usuários cadastrados sem acesso ao banco diretamente.

## 6. Fluxos de Negócio Completos

Conforme exigido pela linha Web Apps (mínimo de três), o FinQuest implementa:

1. **Autenticação → Simulação de carteira** (cadastro, login, compra/venda, persistência).
2. **Trilha de aprendizagem** (Academy → módulo → quiz → XP → progresso persistido).
3. **Competição multiplayer** (Duelo: criação → aceite → negociação simultânea → apuração de vencedor).

---

## 7. Arquitetura

### 7.1 Diagrama de Contexto (C4 - Nível 1)

```
┌──────────┐        ┌─────────────────────┐        ┌──────────────────┐
│ Usuário   │───────▶│      FinQuest        │───────▶│  APIs externas     │
│ (browser) │◀───────│  (Web App + Backend) │◀───────│  Yahoo Finance,     │
└──────────┘        └─────────────────────┘        │  HG Brasil,         │
                                                      │  Anthropic Claude   │
                                                      └──────────────────┘
```

### 7.2 Diagrama de Containers (C4 - Nível 2)

```
┌────────────────────────────────────────────────────────────────────┐
│                            FinQuest                                  │
│                                                                        │
│  ┌───────────────────┐        ┌──────────────────────────┐          │
│  │  SPA (React/Vite)   │  HTTP  │  Backend serverless        │          │
│  │  Hospedada na Vercel │──────▶│  (Vercel Functions, Node)   │          │
│  │  src/pages, hooks,   │◀──────│  api/stocks · macro · news  │          │
│  │  components          │       │  api/ai · admin-update      │          │
│  └───────────────────┘        └──────────┬─────────────────┘          │
│                                              │                          │
│                                              │ Postgres protocol        │
│                                              ▼                          │
│                                  ┌──────────────────────┐               │
│                                  │  Supabase              │               │
│                                  │  Auth + Postgres + RLS  │               │
│                                  └──────────────────────┘               │
└────────────────────────────────────────────────────────────────────┘
```

### 7.3 Modelo de dados (resumo)

```
profiles (1) ──< portfolio (N)     - carteira atual por ticker
profiles (1) ──< trades (N)         - histórico de ordens
profiles (1) ──< progress (N)        - módulos concluídos
profiles (N) ──< duels >── (N) profiles  - duelos com carteiras independentes
```

Detalhamento completo do schema, com SQL e políticas de RLS, em [`app/SUPABASE_SETUP.md`](app/SUPABASE_SETUP.md) e [`app/supabase_duels.sql`](app/supabase_duels.sql).

---

## 8. Decisões Técnicas (ADR resumido)

| # | Decisão | Justificativa | Alternativas consideradas |
|---|---|---|---|
| ADR-01 | React + Vite no frontend | Build rápido, ecossistema maduro, SPA com roteamento client-side adequado a um app com muitas telas interativas (simulador, gráficos em tempo real). | Next.js (descartado - overhead de SSR desnecessário para um app autenticado por trás de login) |
| ADR-02 | Vercel Functions como backend | Permite backend próprio (Node serverless) sem gerenciar infraestrutura, mantendo controle total sobre lógica e segredos - diferente de uma plataforma puramente front-end. Ver justificativa detalhada no README principal. | Backend dedicado (Express em VM) - descartado por custo/complexidade desproporcionais ao escopo do TCC |
| ADR-03 | Supabase (Postgres + Auth + RLS) | Postgres real (não SQLite/H2), com controle de schema e políticas de segurança desenhadas pelo autor, mais autenticação pronta e auditável. | Firebase (descartado - NoSQL dificulta consultas relacionais de ranking/portfólio); banco próprio em VM (descartado por escopo) |
| ADR-04 | Yahoo Finance via proxy serverless (não client-direto) | Evita CORS, esconde detalhes de implementação, permite fallback entre hosts (`query1`/`query2`) de forma transparente ao frontend. | Brapi.dev (usado em versão anterior do projeto - descontinuado por limite de requisições) |
| ADR-05 | Anthropic Claude para a Finny, via proxy `/api/ai` | Chave de API nunca exposta ao client; resposta de fallback graciosa quando a chave não está configurada (não quebra o app). | Chamada direta do frontend à API (descartado - exporia a chave secreta) |
| ADR-06 | Duelos com carteiras independentes (não a carteira principal) | Isola o risco competitivo da carteira de aprendizado do usuário - perder um duelo não afeta o progresso principal, e cada duelo é auditável isoladamente em `duels`. | Reutilizar a carteira principal nos duelos (descartado - misturaria histórico de aprendizado com competição) |

---

## 9. Segurança e Conformidade

- **LGPD** - coleta mínima de dados pessoais (nome, e-mail); sem dados sensíveis; usuário controla e edita seu perfil; exclusão de conta possível via suporte.
- **Segredos de API** isolados no ambiente server-side da Vercel (`ANTHROPIC_API_KEY`, `HG_BRASIL_KEY`, `ADMIN_SECRET`), nunca enviados ao client.
- **Row Level Security** no Postgres (Supabase): políticas por tabela garantem que um usuário só acesse seus próprios registros.
- **Licenças de terceiros** - todas as bibliotecas usadas (React, Vite, Recharts, Supabase JS, React Router) são open-source sob licença MIT, compatível com uso e redistribuição.
- **Dados de mercado** consumidos de fontes públicas (Yahoo Finance, feeds RSS de imprensa) - uso informativo/educacional, sem fins comerciais.

## 10. Instruções de Deploy

Detalhadas em [`app/README.md`](app/README.md#deploy-vercel). Resumo: push em `main` → build automático via Vercel (CI/CD) → publicação em `https://finquest-app-omega.vercel.app`.

## 11. Referências

- LGPD - Lei nº 13.709/2018: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Modelo C4 de arquitetura: https://c4model.com
- Documentação Supabase: https://supabase.com/docs
- Documentação Anthropic Claude API: https://docs.anthropic.com
- The Portfolio Playbook (Católica SC): https://github.com/CatolicaSC-Portfolio/The-Portfolio-Playbook
