# 🔧 Como Resolver Erro de Permissão no Firestore

## ⚠️ Problema

Você está vendo o erro:
```
PERMISSION_DENIED: Missing or insufficient permissions
```

Isso acontece porque as regras do Firestore não permitem escrita.

## ✅ Solução: Configurar Regras Temporárias

### Passo 1: Acessar Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto: **tstree-4a335**
3. Vá em **Firestore Database** > **Regras**

### Passo 2: Configurar Regras Temporárias para Migração

**IMPORTANTE**: Estas regras permitem escrita pública. Use apenas para migração!

Cole este código nas regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scenarios/{scenarioId} {
      // Temporariamente permite leitura E escrita para migração
      allow read, write: if true;
    }
  }
}
```

3. Clique em **Publicar**

### Passo 3: Executar Migração

Agora execute o script novamente:

```bash
npx tsx scripts/migrate-to-firebase.ts
```

### Passo 4: Reconfigurar Regras para Produção (IMPORTANTE!)

**Depois que a migração terminar**, volte e altere as regras para:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scenarios/{scenarioId} {
      allow read: if true;  // Permite leitura pública
      allow write: if false; // Bloqueia escrita via cliente
    }
  }
}
```

Clique em **Publicar** novamente.

---

## 🛡️ Por que isso é necessário?

As regras do Firestore protegem seu banco de dados. Por padrão, o Firestore bloqueia todas as operações até que você configure as regras.

Para migração inicial:
- ✅ Precisamos permitir **escrita** temporariamente
- ✅ Depois voltamos a bloquear para segurança

Para produção:
- ✅ Permite **leitura** pública (qualquer um pode ver os cenários)
- ❌ Bloqueia **escrita** via cliente (apenas backend pode escrever)

---

## 📝 Alternativa: Usar Firebase Admin SDK

Se preferir uma solução mais segura (sem abrir escrita pública), você pode usar o Firebase Admin SDK no backend. Mas isso requer mais configuração.

A solução acima (regras temporárias) é mais rápida para migração única.

---

## ✅ Verificar se funcionou

Depois da migração, no Firebase Console:
1. Vá em **Firestore Database** > **Dados**
2. Deve ver a coleção `scenarios` com seus cenários
3. Cada documento deve ter: `id`, `title`, `rootNode`

Se aparecer, a migração foi bem-sucedida! 🎉
