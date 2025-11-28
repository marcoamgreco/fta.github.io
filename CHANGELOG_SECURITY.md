# 🔒 Changelog de Segurança

## 2024 - Remoção de Vulnerabilidade xlsx

### ✅ Ações Realizadas

1. **Removido pacote vulnerável:**
   - `xlsx@0.18.5` removido do `package.json`
   - Vulnerabilidades corrigidas:
     - Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
     - Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9)

2. **Limpeza de código:**
   - Arquivo `src/utils/excelParser.ts` removido (não estava em uso)
   - Diretório `src/utils/` removido (estava vazio)

### 📊 Status

- **Antes**: 1 vulnerabilidade de alta severidade
- **Depois**: ✅ 0 vulnerabilidades
- **Verificado**: `npm audit` retorna "found 0 vulnerabilities"

### 📝 Notas

O pacote `xlsx` não estava sendo usado na aplicação. Se no futuro for necessário importar arquivos Excel, considere usar bibliotecas mais seguras como:
- `exceljs` - Biblioteca moderna e mantida
- `xlsx-js-style` - Fork com mais recursos

---

**Data**: $(Get-Date -Format "yyyy-MM-dd")
**Status**: ✅ Resolvido
