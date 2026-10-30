@echo off
call "%~dp0..\_ghi-bam.bat" "9-don-dep\1-don-tep-cu-n1"
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
cd /d "%~dp0..\.."
echo [DetPro] Xoa cac tep cua moc N1 khong con dung (#190): components\*.js cu, app\next-check, content
echo (Chi can chay 1 lan. Da chay roi thi bo qua.)
set /p OK=Go y roi Enter de xoa:
if /i not "%OK%"=="y" goto :eof
del /q components\KtShell.js components\VongDet.js components\knowledgeData.js components\topicArt.js components\unitData.js 2>nul
if exist app\next-check rmdir /s /q app\next-check
if exist content rmdir /s /q content
echo Xong.
pause
