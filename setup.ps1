#!/usr/bin/env pwsh
# סקריפט להקמת ה-repo ב-GitHub ודחיפה ראשונית
# הרץ מתוך התיקייה synagogue-board

$ErrorActionPreference = "Stop"

$REPO_NAME = "synagogue-board"
$GITHUB_USER = "msaroussi"

Write-Host "══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  יצירת repo: $REPO_NAME" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════" -ForegroundColor Cyan

# 1. אתחל git
Write-Host "→ מאתחל git..." -ForegroundColor Yellow
git init
git add .
git commit -m "🕎 Initial commit - synagogue LED board"
git branch -M main

# 2. צור repo ב-GitHub
Write-Host "→ יוצר repository ב-GitHub..." -ForegroundColor Yellow
gh repo create $REPO_NAME --public --description "לוח בית כנסת דיגיטלי בסגנון LED" --source=. --remote=origin --push

# 3. הפעל GitHub Pages
Write-Host "→ מפעיל GitHub Pages..." -ForegroundColor Yellow
try {
    gh api -X POST "repos/$GITHUB_USER/$REPO_NAME/pages" -f "build_type=workflow" 2>$null
} catch {
    try {
        gh api -X PUT "repos/$GITHUB_USER/$REPO_NAME/pages" -f "build_type=workflow" 2>$null
    } catch {
        Write-Host "  ⚠️  הפעל GitHub Pages ידנית: Settings → Pages → Source: GitHub Actions" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ סיום!" -ForegroundColor Green
Write-Host "  האתר יהיה זמין בכתובת:" -ForegroundColor Green
Write-Host "  https://$GITHUB_USER.github.io/$REPO_NAME/" -ForegroundColor White
Write-Host "══════════════════════════════════════" -ForegroundColor Green
