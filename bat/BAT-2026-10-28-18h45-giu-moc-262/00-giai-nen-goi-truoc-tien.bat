@echo off
chcp 65001 >nul
echo Giai nen goi-262.zip vao C:\Dienpham\App (10 tep web: gom ca #260 va #262)
cd /d "%~dp0"
tar -xf "goi-262.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
echo Xong. Bam tiep 1-day-len-web.bat
pause
