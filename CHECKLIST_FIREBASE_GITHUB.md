# ✅ Checklist: Firebase no GitHub Pages

## 🔍 O que falta para funcionar:

### 1. ✅ Firebase Configurado
- [x] Credenciais adicionadas em `src/firebase/config.ts`
- [x] Firebase e Firestore inicializados

### 2. ⚠️ App.tsx ainda não usa Firebase
- [ ] Atualizar `App.tsx` para usar o hook `useScenarios`
- [ ] Substituir importação direta de `scenarios` pelo hook
- [ ] Adicionar estado de loading durante carregamento
- [ ] Manter fallback para dados locais

### 3. ⚠️ Dados precisam ser migrados para Firestore
- [ ] Executar script de migração: `npx tsx scripts/migrate-to-firebase.ts`
- [ ] Verificar se dados aparecem no Firebase Console

### 4. ⚠️ Regras do Firestore precisam permitir leitura pública
- [ ] Configurar regras no Firebase Console para permitir leitura
- [ ] Para produção, considerar autenticação

### 5. ⚠️ Verificar ordem no Firestore
- [ ] Adicionar campo `title` como índice (ou remover `orderBy('title')` se não existir)

---

## 🚀 Passos para concluir:

1. **Atualizar App.tsx** (vou fazer isso agora)
2. **Migrar dados para Firestore**
3. **Configurar regras do Firestore**
4. **Testar localmente**
5. **Fazer deploy no GitHub Pages**
