@echo off
call "%~dp0..\_ghi-bam.bat" "3-chay-thu\1-chay-thu"
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
cd /d "%~dp0..\.."
echo [DetPro] Chay thu (che do sua code) o http://localhost:3001
echo   - Bai hoc: http://localhost:3001/for/...   Chu de: http://localhost:3001/knowledge
echo   - Hoc cung: http://localhost:3001/nhom/tao
echo   - Kiem tra MongoDB: http://localhost:3001/api/mongo-check
echo   Dung: bam Ctrl+C
echo.
call npm run dev
pause
