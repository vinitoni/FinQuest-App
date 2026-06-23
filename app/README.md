# FinQuest: Deploy Guide

## O que está nesse pacote

```
finquest/
├── index.html          ← entrada do app
├── package.json        ← dependências
├── vite.config.js      ← configuração do build
├── .gitignore
└── src/
    ├── main.jsx        ← inicializa o React
    └── App.jsx         ← todo o app FinQuest
```

---

## Pré-requisitos

- **Node.js 18+** → https://nodejs.org (baixe a versão LTS)
- **Conta no GitHub** → https://github.com (gratuita)
- **Conta na Vercel** → https://vercel.com (gratuita, login com GitHub)

---

## Passo a passo completo

### 1. Instalar dependências (uma vez só)

```bash
npm install
```

### 2. Testar local antes de publicar

```bash
npm run dev
```

Abre em `http://localhost:5173`. Aqui o Brapi.dev **funciona normalmente**.

### 3. Subir para o GitHub

```bash
git init
git add .
git commit -m "FinQuest v1"
```

Crie um repositório novo em https://github.com/new (pode ser privado), depois:

```bash
git remote add origin https://github.com/SEU_USUARIO/finquest.git
git push -u origin main
```

### 4. Publicar na Vercel

1. Acesse https://vercel.com e faça login com o GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório `finquest`
4. Configurações (já detectadas automaticamente pelo Vite):
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Clique em **Deploy**

Em ~2 minutos o app estará live em `https://finquest.vercel.app` (ou nome customizado).

---

## Preços em tempo real (Brapi.dev)

O app já está configurado para buscar preços reais da B3 automaticamente.

- Atualiza ao abrir o app
- Atualiza a cada **5 minutos** automaticamente
- Botão manual "🔄 Atualizar" no Dashboard e no Simulador
- Se a API cair, exibe o último fechamento conhecido como fallback

**Não é necessário fazer nada**, funciona automaticamente após o deploy.

Se quiser mais requisições ou dados extras (histórico longo, FIIs, fundamentos), crie uma conta em https://brapi.dev e substitua `?token=demo` pela sua chave no arquivo `App.jsx`.

---

## Atualizações futuras

Para atualizar o app depois de fazer mudanças:

```bash
git add .
git commit -m "descrição da mudança"
git push
```

A Vercel detecta o push e republica automaticamente em ~1 minuto.

---

## Acesso Admin

Digite `finquestadmin` no teclado (fora de qualquer campo de texto) em qualquer tela do app.
Credenciais: `admin@finquest.com` / `admin123`
