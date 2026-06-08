# FinQuest — MazyOS

> Workspace operacional do FinQuest. Aqui eu construo o produto, documento,
> gero conteúdo e preparo a apresentação do TCC com cara de startup real.

## O que é esse workspace

Operação solo do FinQuest — plataforma de educação financeira gamificada.
Foco atual: entregar o TCC com qualidade de produto unicórnio e base para escalar depois.

**Estrutura de pastas:**
- `_memoria/` — contexto do negócio, tom de voz, prioridades
- `identidade/` — cores, tipografia, padrão visual
- `marketing/` — conteúdo, carrosséis, SEO (saída das skills)
- `saidas/` — documentação, análises, emails, pitch
- `dados/` — arquivos a analisar (CSV, PDF, planilha)
- `scripts/` — utilitários (cotações, render, automações)
- `app/` — código da plataforma (Next.js / Vercel)

## Quem sou

Founder solo do FinQuest. Toco tudo — produto, design, código, conteúdo e documentação.
O produto existe e funciona. O foco agora é polir e apresentar.

## O que o FinQuest entrega

Plataforma onde o usuário aprende a investir praticando — R$100k virtuais, simulador com ativos reais da B3, cursos por níveis, gamificação estilo Duolingo e mentor com IA.

**Para quem:** brasileiros que querem investir mas ainda não se sentem seguros.
**Modelo:** freemium — gratuito com básico, Premium com IA avançada + conteúdo completo + competições.

## Tom de voz

Direto, acessível, profissional sem ser frio. Vocabulário fácil mas preciso. O usuário deve se sentir capaz, não intimidado.

Evitar: jargão de guru, motivacional vazio, formalidade excessiva, superlativos inflados.

## Prioridade atual

TCC com apresentação em vista. Entregar com qualidade de produto real:
1. Design refinado (dark premium, verde FinQuest)
2. Documentação no padrão acadêmico
3. Experiência sem gaps visíveis
4. Pitch convincente

## Skills disponíveis

Skills ficam em `.claude/skills/<nome>/SKILL.md`. Antes de executar qualquer tarefa, verificar se existe skill relevante.

| Skill | Trigger | O que faz |
|---|---|---|
| `/instalar` | Setup inicial | Entrevista, preenche memória, adapta CLAUDE.md |
| `/abrir` | Início de sessão | Carrega contexto e devolve resumo de 5 linhas |
| `/salvar` | Backup/sync | Commit + push no GitHub |
| `/atualizar` | Reconciliação | Varre workspace e atualiza memória desatualizada |
| `/mapear-rotinas` | Automação | Descobre padrões repetidos e transforma em skill nova |
| `/carrossel` | Conteúdo visual | Carrosséis 1080×1350 com identidade FinQuest |
| `/publicar-tema` | Conteúdo | Artigo + carrossel + legendas a partir de um tema |
| `/seo` | SEO | Fluxo completo de 8 passos |
| `/analisar-dados` | Dados | Lê CSV/XLSX/PDF e gera resumo executivo |
| `/email-profissional` | Comunicação | Rascunha email a partir de contexto livre |
| `/anuncio-google` | Mídia paga | Campanha completa em CSV pro Google Ads Editor |
| `/relatorio-ads` | Análise | Relatório semanal Google + Meta com alertas |

## Regras do sistema

- Conteúdo gerado salvar em `marketing/conteudo/<tipo>-<tema>-<data>/`
- Documentação do TCC em `saidas/tcc/`
- Scripts de cotação e dados em `scripts/`
- Código da plataforma em `app/` — deploy via Vercel

## Contexto do negócio

No início de toda conversa, ler:
1. `_memoria/empresa.md` — quem é o negócio, clientes, equipe
2. `_memoria/preferencias.md` — tom de voz, estilo, o que evitar
3. `_memoria/estrategia.md` — foco atual, prioridades, prazos

Para tarefas visuais (carrossel, post, landing page), consultar `identidade/design-guide.md`.
Não confirmar a leitura. Usar o contexto naturalmente.

---

## Aprender com correções

Quando o usuário corrigir algo com "na verdade é assim", "não faça mais isso" ou "prefiro assim", perguntar:

> "Quer que eu salve isso pra não precisar repetir?"

Se sim, salvar no arquivo de memória correspondente.

---

## Manter contexto atualizado

Ao terminar uma tarefa que mudou algo relevante, perguntar:

> "Isso mudou algo no teu contexto. Quer que eu atualize a memória?"

Não perguntar pra tarefas pontuais. Usar `/atualizar` pra varredura completa quando houver dúvida.

---

## Criação de skills

1. Verificar se existe template relevante em `templates/skills/`
2. Perguntar se é específica desse projeto (`.claude/skills/`) ou universal (`~/.claude/skills/`)
3. Ler `_memoria/empresa.md` e `_memoria/preferencias.md` pra calibrar ao contexto
4. Seguir o fluxo da skill-creator nativa do Claude Code
