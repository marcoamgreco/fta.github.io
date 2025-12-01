# Configuração do GitHub Actions para Deploy Automático

Este guia explica como configurar os secrets do GitHub para o deploy automático funcionar.

## 📋 Passo a Passo

### 1. Acessar as Configurações do Repositório

1. Vá para o seu repositório no GitHub: `https://github.com/marcoamgreco/fta.github.io`
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

### 2. Adicionar os Secrets

Clique em **New repository secret** e adicione cada uma das seguintes variáveis:

#### Secrets necessários:

| Nome do Secret | Valor | Descrição |
|----------------|-------|-----------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyB69U48JqtAgOI1vSFk9XRapN3iscavbgc` | Chave da API do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `tstree-4a335.firebaseapp.com` | Domínio de autenticação |
| `VITE_FIREBASE_PROJECT_ID` | `tstree-4a335` | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | `tstree-4a335.firebasestorage.app` | Bucket de armazenamento |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `441515792176` | ID do remetente de mensagens |
| `VITE_FIREBASE_APP_ID` | `1:441515792176:web:208538e871cbfbf858daf5` | ID do aplicativo |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-J19B5T35M5` | ID de medição (Analytics) |

### 3. Habilitar GitHub Pages

1. Ainda em **Settings**, vá para **Pages**
2. Em **Source**, selecione **GitHub Actions**
3. Salve as alterações

### 4. Verificar o Deploy

Após configurar os secrets:

1. Faça um push para a branch `master` (ou execute manualmente o workflow)
2. Vá para a aba **Actions** do seu repositório
3. Você verá o workflow "Deploy to GitHub Pages" em execução
4. Quando concluir, seu site estará disponível em: `https://marcoamgreco.github.io/fta.github.io/`

## 🔒 Segurança

- ✅ Os secrets são criptografados e nunca aparecem nos logs
- ✅ Apenas pessoas com permissão podem ver/editar os secrets
- ✅ Os secrets são injetados apenas durante o build, não no código final

## 🚀 Execução Manual

Você também pode executar o workflow manualmente:

1. Vá para a aba **Actions**
2. Selecione o workflow "Deploy to GitHub Pages"
3. Clique em **Run workflow**
4. Selecione a branch `master` e clique em **Run workflow**

## 📝 Notas

- O workflow é executado automaticamente a cada push na branch `master`
- O build usa as variáveis de ambiente dos secrets do GitHub
- O arquivo `.env` é criado apenas durante o build e não é commitado
- O deploy é feito automaticamente para o GitHub Pages após o build bem-sucedido
