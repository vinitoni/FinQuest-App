# FinQuest – WebApp de Educação Financeira Gamificada

O **FinQuest** é um Progressive Web App que transforma educação financeira em prática através de simulação, gamificação e missões guiadas.  
O objetivo é ajudar iniciantes e investidores intermediários a desenvolver hábitos financeiros reais sem arriscar dinheiro de verdade.

---

## 📌 Resumo

O FinQuest combina:

- Microlições
- Missões gamificadas com XP, níveis e badges
- Carteira simulada com dinheiro fictício
- Calculadoras de juros compostos, preço médio e renda fixa
- Um Plano de 30 Dias guiado com explicabilidade (HHI, rebalanceamento, meses de reserva)
- Scores finais de:
  - **Literacia**
  - **Saúde da Carteira (HHI)**
  - **Comportamento**

A aplicação prioriza **privacidade**, operando por padrão em modo simulado e seguindo princípios da **LGPD** e segurança **OWASP Top 10**.

---

## 🎯 Objetivos

### Objetivo Geral
Promover inteligência financeira prática por meio de ensino, prática e gamificação.

### Objetivos Específicos
- Criar onboarding com perfil de risco e metas.
- Desenvolver trilhas de microlições com quizzes e feedback imediato.
- Simular investimentos com ativos brasileiros (ações, FIIs, renda fixa).
- Disponibilizar calculadoras completas.
- Implementar missões gamificadas com nudges explicáveis.
- Gerar scores e relatórios exportáveis.
- Garantir segurança, privacidade e acessibilidade.

---

## 🧩 Problemas Resolvidos

- Dificuldade de transformar teoria financeira em prática.
- Falta de acompanhamento e métricas claras.
- Insegurança de começar a investir sem experiência.
- Ausência de critérios claros de diversificação e rebalanceamento.
- Falta de consistência e motivação.

---

## 🚀 Diferenciais

- Missões explicáveis com critérios financeiros reais (HHI, bandas, meses de reserva).
- Simulação 100% fictícia para evitar riscos.
- Gamificação significativa (XP, níveis, badges).
- Scores que medem aprendizado, saúde da carteira e comportamento.
- Foco no mercado brasileiro (FIIs, ações, dividendos, JCP).
- Privacidade por design (dados mínimos, modo simulado).

---

## 🧱 Arquitetura

### Visão Geral
Arquitetura Cliente-Servidor em camadas:

- **Front-end:** Angular 16 + TypeScript + PWA + NgRx  
- **Back-end:** .NET 8 Web API + DDD + EF Core  
- **Banco de Dados:** SQL Server ou PostgreSQL  
- **Armazenamento de Arquivos:** Azure Blob / S3 compatível  
- **Design & Diagramas:** Figma, Lucidchart, C4 Model  

### Padrões Adotados
- MVC/MVVM (Front)
- DDD (Domínio)
- Arquitetura em Camadas (API)
- C4 Model (Contexto, Containers, Componentes)

---

## 📋 Requisitos

### Requisitos Funcionais (RF)
- **RF01** – Cadastro e login com JWT  
- **RF02** – Onboarding + plano personalizado  
- **RF03** – Trilhas de ensino com quizzes  
- **RF04** – Carteira simulada com preço médio  
- **RF05** – Calculadoras financeiras  
- **RF06** – Missões, XP, nudges e badges  
- **RF07** – Scores e relatórios exportáveis  
- **RF08** – (Futuro) Importação CSV/OFX  

### Requisitos Não Funcionais (RNF)
- **RNF01** – Tempo de resposta < 500 ms  
- **RNF02** – Usabilidade mobile-first (WCAG 2.1 AA)  
- **RNF03** – Segurança OWASP + HTTPS + JWT  
- **RNF04** – API stateless escalável  
- **RNF05** – Uptime ≥ 99%  
- **RNF06** – Logs e auditoria sem dados sensíveis  

---

## 🛡 Segurança e Conformidade

- **LGPD** — dados mínimos, consentimento, exclusão opcional  
- **OWASP Top 10** — prevenção de injeção, XSS e CSRF  
- **ISO/IEC 27001** — diretrizes de segurança da informação  
- **ISO/IEC 25010** — qualidade e manutenção  
- **WCAG 2.1** — acessibilidade  

---

## 📊 Métricas do MVP

- **Literacy Score:** +20 p.p. no pós-quiz  
- **Portfolio Health (HHI):** –25% de concentração  
- **Behavior Score:** ≥ 70% das missões concluídas  
- **Engajamento:** ≥ 1 simulação/semana  
- **Retenção:** ≥ 50% concluem o plano  

---

## 🖥 Mockups

As telas incluem:

- Login  
- Dashboard  
- Simulador de Carteira  
- Calculadoras  
- Missões  
- Relatórios  

*(Mockups completos encontram-se no arquivo PDF original do projeto.)*

---

## 🗓 Cronograma (Portfólio I e II)

| Fase | Entrega | Data |
|------|---------|------|
| **Definição & RFC** | Requisitos + protótipos | até 15/03/2026 |
| **Protótipo Interativo** | Mockups + arquitetura | até 30/04/2026 |
| **Sprint 1** | Onboarding + autenticação | 15/05/2026 |
| **Sprint 2** | Calculadoras + carteira simulada | 25/05/2026 |
| **Sprint 3** | Missões + XP | 01/06/2026 |
| **Sprint 4** | Scores + relatórios + testes | 15/06/2026 |
| **Entrega MVP** | Hospedagem + documentação | 20/06/2026 |
| **Entrega Final** | Importações + competições + IA | Junho/2026 |

---

## 📚 Referências

- Estudos sobre nudges e comportamento financeiro  
- Meta-análises de educação financeira  
- Documentação OWASP Top 10  
- Diretrizes LGPD  
- WCAG 2.1  
- ISO/IEC 27001 e ISO/IEC 25010  

---

## 🏷 Licença

Este projeto é licenciado sob a **MIT License**.

---

## 👤 Autor

**Vinícius Toni Rocha**  
Engenharia de Software – Católica SC  
Projeto desenvolvido para Portfólio I & II (TCC)

---
