# 🔍 O que falta para Firebase funcionar no GitHub Pages

## ✅ O que já está feito:

1. ✅ Firebase configurado com credenciais
2. ✅ Serviço de cenários criado (`scenariosService.ts`)
3. ✅ Hook `useScenarios` criado
4. ✅ Fallback para dados locais implementado

## ⚠️ O que falta:

### 1. **App.tsx ainda não usa Firebase**
   - O `App.tsx` ainda importa `scenarios` diretamente do arquivo local
   - Precisa usar o hook `useScenarios` que já foi criado
   - **Status**: Precisa atualização no código

### 2. **Dados precisam ser migrados para Firestore**
   - O script de migração existe, mas precisa ser executado
   - **Comando**: `npx tsx scripts/migrate-to-firebase.ts`
   - **Status**: Ação manual necessária

### 3. **Regras do Firestore precisam permitir leitura**
   - No Firebase Console > Firestore > Regras
   - Precisa permitir leitura pública (pelo menos temporariamente)
   - **Status**: Configuração manual necessária

### 4. **Query do Firestore pode precisar ajuste**
   - O código tenta fazer `orderBy('title')` que pode precisar de índice
   - Pode precisar remover o `orderBy` ou criar índice no Firebase
   - **Status**: Pode dar erro ao executar (será resolvido depois)

---

## 🚀 Passos para concluir:

### Passo 1: Atualizar App.tsx (Vou fazer agora)
- Substituir importação direta de `scenarios`
- Usar hook `useScenarios`
- Adicionar loading state

### Passo 2: Migrar dados
```bash
npm install -D tsx  # Se ainda não instalou
npx tsx scripts/migrate-to-firebase.ts
```

### Passo 3: Configurar regras do Firestore
No Firebase Console:
1. Vá em **Firestore Database** > **Regras**
2. Cole este código:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scenarios/{scenarioId} {
      allow read: if true;  // Permite leitura pública
      allow write: if false; // Desabilita escrita via cliente
    }
  }
}
```
3. Clique em **Publicar**

### Passo 4: Testar localmente
```bash
npm run dev
```
Verifique no console do navegador:
- Deve aparecer: `✅ Carregados X cenários do Firebase`
- Ou: `✅ Carregados X cenários do arquivo local` (se Firebase falhar)

### Passo 5: Deploy no GitHub Pages
- Fazer commit e push das mudanças
- O GitHub Actions vai fazer deploy automaticamente

---

## 📝 Nota Importante:

Se der erro de índice no Firestore (`orderBy`), você pode:
1. **Opção A**: Criar índice no Firebase Console (ele vai sugerir)
2. **Opção B**: Remover `orderBy` temporariamente do código

Vou ajustar o código para remover o `orderBy` por enquanto para evitar esse problema.
