# 🚀 Como Fazer Deploy no GitHub Pages (fta.github.io)

## Método 1: Deploy Automatizado com GitHub Actions (Recomendado ✨)

Este é o método mais fácil! O GitHub Actions vai fazer o deploy automaticamente sempre que você fizer push na branch `main`.

### Passos:

1. **Certifique-se de que o workflow está criado:**
   - O arquivo `.github/workflows/deploy.yml` já foi criado
   - Ele vai fazer o build e deploy automaticamente

2. **Configure o GitHub Pages no repositório:**
   - Vá em: **Settings > Pages** do seu repositório `fta.github.io`
   - Em **Source**, selecione: **GitHub Actions**
   - Salve

3. **Faça commit e push:**
   ```bash
   git add .
   git commit -m "Deploy: atualização do FTA Studio"
   git push origin main
   ```

4. **Pronto!** 🎉
   - O GitHub Actions vai buildar e fazer o deploy automaticamente
   - Em alguns minutos, seu site estará disponível em: `https://fta.github.io`

---

## Método 2: Deploy Manual

Se preferir fazer o deploy manualmente:

### Passos:

1. **Buildar o projeto:**
   ```bash
   npm run build
   ```
   Isso gera os arquivos na pasta `dist/`

2. **Usar o script de deploy (Windows):**
   ```powershell
   .\deploy.ps1
   ```

3. **Ou manualmente:**
   - Copie todo o conteúdo da pasta `dist/` para a raiz do repositório
   - **IMPORTANTE:** Para repositórios `fta.github.io`, os arquivos devem estar na raiz da branch `main`

4. **Commit e push:**
   ```bash
   git add .
   git commit -m "Deploy: atualização do FTA Studio"
   git push origin main
   ```

---

## ⚠️ Configuração Importante

### Para repositório `fta.github.io`:

- Os arquivos devem estar na **raiz** da branch `main`
- O `base` no `vite.config.ts` deve ser `'/'` (já configurado)
- Não precisa de branch `gh-pages` separada

### Configuração do GitHub Pages:

1. Vá em: **Settings > Pages**
2. Se usando GitHub Actions: selecione **GitHub Actions** como source
3. Se usando deploy manual: selecione **main** branch e folder **/ (root)**

---

## 📝 Notas

- O arquivo `.gitignore` atualmente ignora a pasta `dist`
- Se usar deploy manual, você pode remover `dist` do `.gitignore` temporariamente
- Com GitHub Actions, não precisa commitar a pasta `dist`

---

## 🔧 Troubleshooting

**Site não aparece?**
- Verifique se o GitHub Pages está habilitado em Settings > Pages
- Aguarde alguns minutos após o push
- Verifique se há erros na aba "Actions" do GitHub

**Erro 404?**
- Certifique-se de que o `base` no `vite.config.ts` está como `'/'`
- Verifique se os arquivos estão na raiz da branch `main`
