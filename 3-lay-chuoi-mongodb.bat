@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [DetPro Next.js] Chep chuoi ket noi MongoDB + khoa Google Drive tu project cu vao .env.local (khong in ra man hinh, khong len git)...
call node scripts\lay-chuoi-mongodb.mjs --nguon "C:\Dienpham\App\SEO-PT-projectjs\server\ulti\mongodb.js"
echo.
echo Kiem tra: chay 2-chay-thu.bat roi mo http://localhost:3001/api/mongo-check
pause
