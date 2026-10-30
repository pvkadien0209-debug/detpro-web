@echo off
call "%~dp0..\_ghi-bam.bat" "9-don-dep\2-xoa-bat-cu-o-goc"
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
cd /d "%~dp0..\.."
echo [DetPro] #233: xoa 7 tep .bat cu o thu muc goc (da chuyen vao thu muc bat\)
echo   0-cai-dat.bat  1-dong-bo-du-lieu.bat  2-chay-thu.bat  3-lay-chuoi-mongodb.bat
echo   4-day-len-github.bat  5-build-thu.bat  6-don-tep-cu.bat
set /p OK=Go y roi Enter de xoa:
if /i not "%OK%"=="y" goto :eof
for %%F in (0-cai-dat.bat 1-dong-bo-du-lieu.bat 2-chay-thu.bat 3-lay-chuoi-mongodb.bat 4-day-len-github.bat 5-build-thu.bat 6-don-tep-cu.bat) do if exist "%%F" del /q "%%F"
echo Xong. Cac tep .bat nay gio nam trong thu muc bat\ (xem bat\DOC-TOI.txt).
pause
