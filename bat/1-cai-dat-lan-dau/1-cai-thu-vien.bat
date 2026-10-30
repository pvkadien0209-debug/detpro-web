@echo off
call "%~dp0..\_ghi-bam.bat" "1-cai-dat-lan-dau\1-cai-thu-vien"
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
cd /d "%~dp0..\.."
echo [DetPro] Buoc 1/3 lan dau: cai thu vien (npm install)...
call npm install
echo.
echo Xong. Buoc tiep: bat\1-cai-dat-lan-dau\2-lay-chuoi-mongodb.bat
pause
