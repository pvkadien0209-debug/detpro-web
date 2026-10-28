@echo off
chcp 65001 >nul
echo Giai nen goi-253.zip vao C:\Dienpham\App (ghi de 10 tep web Hoc cung + QUY-TRINH tiet kiem)
cd /d "%~dp0"
tar -xf "goi-253.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
echo Xong. Bam tiep 1-day-len-github.bat
pause
