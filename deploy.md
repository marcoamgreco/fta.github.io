# Guia de Deploy para GitHub Pages (fta.github.io)

## Opções de Deploy

### Opção 1: Deploy Manual (Mais Simples)

1. **Buildar o projeto:**
   ```bash
   npm run build
   ```
   Isso vai gerar os arquivos estáticos na pasta `dist/`

2. **Configurar o repositório remoto (se ainda não configurou):**
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/fta.github.io.git
   # OU se já existe:
   git remote set-url origin https://github.com/SEU_USUARIO/fta.github.io.git
   ```

3. **Para o repositório `fta.github.io`, você tem duas opções:**

   **Opção A: Commitar `dist/` na branch `main` (recomendado para fta.github.io)**

   Primeiro, ajuste o `.gitignore` para NÃO ignorar a pasta `dist`:
   - Remova ou comente a linha `dist` do `.gitignore`

   Depois, copie o conteúdo de `dist/` para a raiz:
   ```bash
   # Buildar
   npm run build

   # Copiar arquivos da dist para a raiz (manualmente ou com script)
   # Windows PowerShell:
   Copy-Item -Path "dist\*" -Destination "." -Recurse -Force

   # Linux/Mac:
   # cp -r dist/* .
   ```

   Ou use o script de deploy automatizado (ver abaixo).

   **Opção B: Usar branch `gh-pages`**
   ```bash
   git checkout -b gh-pages
   git add dist/
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

4. **Commit e Push:**
   ```bash
   git add .
   git commit -m "Deploy: atualização do FTA Studio"
   git push origin main
   ```

5. **Configurar GitHub Pages:**
   - Vá em Settings > Pages do repositório
   - Source: selecione `main` branch
   - Folder: `/ (root)` ou `/dist` dependendo de onde colocou os arquivos
   - Salve

### Opção 2: Deploy Automatizado com GitHub Actions (Recomendado)

Crie um arquivo `.github/workflows/deploy.yml` (já criado para você - ver abaixo).

---

## Script de Deploy Rápido

Use o script `deploy.ps1` (Windows) ou `deploy.sh` (Linux/Mac) que foi criado para automatizar o processo.
