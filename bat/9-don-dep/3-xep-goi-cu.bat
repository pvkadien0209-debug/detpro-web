@echo off
chcp 65001 >nul
call "%~dp0..\_ghi-bam.bat" "9-don-dep\3-xep-goi-cu"
rem #326 chuyen cac thu muc viec BAT-* cu vao bat\_cu\ (may van giu; GitHub se xoa o lan day toi)
cd /d "%~dp0.."
if not exist "_cu" mkdir "_cu"
set N=0
for /d %%d in (BAT-*) do (
  move "%%d" "_cu\" >nul && echo   Da chuyen %%d
  set /a N+=1
)
echo.
echo Xong. Tu nay chi can mo DetPro-WEB-DIEU-KHIEN.xlsx (hoac bam 5-cap-nhat-goi\1-cap-nhat-goi-moi-nhat.bat).
pause
