# 🚀 Firebase - Guia Rápido de Migração

## ⚡ Passos Rápidos

### 1. Instalar Firebase
```bash
npm install firebase
```

### 2. Criar Projeto no Firebase Console
1. Acesse https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Escolha um nome e crie o projeto

### 3. Habilitar Firestore
1. No painel, vá em **Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Começar no modo de teste"**
4. Escolha localização (ex: `southamerica-east1`)

### 4. Obter Credenciais
1. Vá em ⚙️ **Configurações do projeto** > **Suas apps**
2. Clique no ícone **Web (`</>`)** e registre um app
3. **Copie as credenciais** que aparecem

### 5. Configurar Credenciais

**Opção A - Variáveis de Ambiente (Recomendado):**
```bash
# Crie o arquivo .env na raiz do projeto
cp .env.example .env

# Edite .env e cole suas credenciais
```

**Opção B - Direto no código:**
Edite `src/firebase/config.ts` e substitua as credenciais

### 6. Migrar Dados

**Usando script de migração:**
```bash
# Instale tsx para executar TypeScript
npm install -D tsx

# Execute o script de migração
npx tsx scripts/migrate-to-firebase.ts
```

### 7. Testar

A aplicação agora tentará carregar do Firebase automaticamente. Se não estiver configurado, usará os dados locais como fallback.

## 📁 Estrutura de Arquivos Criados

```
src/
  firebase/
    config.ts              # Configuração do Firebase
    scenariosService.ts    # Serviços para ler/escrever cenários

scripts/
  migrate-to-firebase.ts   # Script para migrar dados

hooks/
  useScenarios.ts          # Hook React para carregar cenários

.env.example               # Template de variáveis de ambiente
FIREBASE_MIGRATION_GUIDE.md  # Guia detalhado
```

## 🔍 Verificar se Funcionou

1. Execute a aplicação: `npm run dev`
2. Abra o console do navegador (F12)
3. Você verá: `✅ Carregados X cenários do Firebase` ou `✅ Carregados X cenários do arquivo local`

## ⚠️ Importante

- Mantenha `scenarios.ts` como backup
- As credenciais do Firebase devem ser mantidas secretas (use .env)
- O arquivo `.env` está no .gitignore (não será commitado)

## 🆘 Problemas Comuns

**Erro: "Firebase não configurado"**
→ Verifique se as credenciais estão corretas no `.env` ou `config.ts`

**Dados não aparecem**
→ Execute o script de migração primeiro: `npx tsx scripts/migrate-to-firebase.ts`

**Erro de permissão no Firestore**
→ Verifique as regras de segurança no Firebase Console

## 📚 Próximos Passos

- [ ] Configurar autenticação Firebase (opcional)
- [ ] Ajustar regras de segurança para produção
- [ ] Implementar atualização em tempo real
- [ ] Configurar backup automático
