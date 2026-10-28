@echo off
chcp 65001 >nul
echo Giai nen goi-263.zip vao C:\Dienpham\App (11 tep web: gom ca #258 #260 #262 #263)
cd /d "%~dp0"
tar -xf "goi-263.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
echo Xong. Bam tiep 1-day-len-web.bat
pause
