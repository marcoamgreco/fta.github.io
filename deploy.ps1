# Script de Deploy para GitHub Pages (Windows PowerShell)
# Para repositório fta.github.io

Write-Host "🚀 Iniciando deploy para GitHub Pages..." -ForegroundColor Cyan

# 1. Buildar o projeto
Write-Host "📦 Buildando o projeto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao buildar o projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído!" -ForegroundColor Green

# 2. Copiar arquivos de dist para a raiz
Write-Host "📁 Copiando arquivos para a raiz..." -ForegroundColor Yellow

# Remove arquivos antigos (exceto os necessários)
Get-ChildItem -Path . -Exclude node_modules,src,.git,.github,dist,*.json,*.config.*,*.ts,*.md,.gitignore,deploy.* | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copia arquivos da dist para a raiz
Copy-Item -Path "dist\*" -Destination "." -Recurse -Force

Write-Host "✅ Arquivos copiados!" -ForegroundColor Green

# 3. Status do Git
Write-Host "📊 Status do Git:" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "✨ Pronto! Agora você pode fazer:" -ForegroundColor Green
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Deploy: atualização do FTA Studio'" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor White
