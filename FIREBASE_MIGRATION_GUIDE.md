# Guia de Migração: scenarios.ts → Firebase Firestore

Este guia irá te orientar passo a passo para migrar os dados de `scenarios.ts` para o Firebase Firestore.

## 📋 Pré-requisitos

1. Conta no Google Firebase
2. Node.js instalado
3. Projeto criado no Firebase Console

## 🚀 Passo 1: Configurar Firebase no Projeto

### 1.1 Criar Projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Escolha um nome (ex: "fta-studio")
4. Configure Analytics (opcional)
5. Aguarde a criação

### 1.2 Habilitar Firestore Database

1. No painel do projeto, vá em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Começar no modo de teste"** (para desenvolvimento)
4. Escolha uma localização (ex: `southamerica-east1` para Brasil)
5. Aguarde a criação

### 1.3 Configurar Regras de Segurança

1. Vá em **"Regras"** do Firestore
2. Para desenvolvimento, use estas regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura para todos
    match /scenarios/{scenarioId} {
      allow read: if true;
      allow write: if false; // Desabilitar escrita via cliente por segurança
    }
  }
}
```

### 1.4 Obter Credenciais do Projeto

1. No Firebase Console, vá em **⚙️ Configurações do projeto** > **Suas configurações**
2. Role até **"Seus apps"** e clique no ícone **Web (`</>`)**
3. Registre um app (ex: "FTA Studio Web")
4. **Copie as credenciais** que aparecem (serão usadas depois)

## 🔧 Passo 2: Instalar Dependências

Execute no terminal:

```bash
npm install firebase
```

## 📁 Passo 3: Configurar Firebase no Projeto

Crie o arquivo de configuração do Firebase:

1. Crie `src/firebase/config.ts` (será criado automaticamente no próximo passo)
2. Cole suas credenciais do Firebase

## 📤 Passo 4: Migrar Dados para Firestore

### Opção A: Script de Migração Automática (Recomendado)

Use o script `scripts/migrate-to-firebase.ts` que será criado. Ele:
- Lê todos os cenários de `scenarios.ts`
- Faz upload para o Firestore
- Mantém a estrutura hierárquica

### Opção B: Migração Manual via Console

1. No Firebase Console, vá em **Firestore Database** > **Dados**
2. Clique em **"Iniciar coleção"**
3. Nome da coleção: `scenarios`
4. Adicione cada cenário como documento individual

## 🔄 Passo 5: Atualizar Código para Usar Firebase

O código será atualizado para:
- Ler dados do Firestore
- Manter compatibilidade com `scenarios.ts` como fallback
- Permitir atualização em tempo real

## 📝 Estrutura no Firestore

```
scenarios (collection)
  ├── fcc-catalyst-circulation (document)
  │   ├── id: "fcc-catalyst-circulation"
  │   ├── title: "Circulação de Catalisador Errática"
  │   └── rootNode: { ... } (objeto completo)
  │
  ├── fcc-catalyst-loss (document)
  │   └── ...
  │
  └── [outros cenários...]
```

## 🔐 Segurança e Autenticação (Opcional)

Para produção, considere:
- Configurar autenticação Firebase
- Implementar regras de segurança mais rígidas
- Usar Firebase Admin SDK para escrita no backend

## 📚 Próximos Passos

Após a migração:
1. Testar leitura de dados do Firestore
2. Atualizar exportação para também salvar no Firestore
3. Implementar sincronização em tempo real
4. Configurar backup automático

## ⚠️ Notas Importantes

- **Modo de teste**: Por padrão, o Firestore permite leitura/escrita para todos (válido por 30 dias)
- **Custos**: Firestore tem plano gratuito generoso, mas monitore uso
- **Backup**: Mantenha `scenarios.ts` como backup local
- **Performance**: Dados serão carregados sob demanda
