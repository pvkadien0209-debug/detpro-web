@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [DetPro Next.js] Chay thu o http://localhost:3001
echo   - Bai hoc: http://localhost:3001/for/...   Chu de: http://localhost:3001/knowledge
echo   - Kiem tra MongoDB: http://localhost:3001/api/mongo-check
echo.
call npm run dev
