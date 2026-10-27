@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [DetPro Next.js] Xoa cac tep cua moc N1 khong con dung (#190): components\*.js cu, app\next-check, content
del /q components\KtShell.js components\VongDet.js components\knowledgeData.js components\topicArt.js components\unitData.js 2>nul
if exist app\next-check rmdir /s /q app\next-check
if exist content rmdir /s /q content
echo Xong.
pause
