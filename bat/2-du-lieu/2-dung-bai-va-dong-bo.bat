@echo off
call "%~dp0..\_ghi-bam.bat" "2-du-lieu\2-dung-bai-va-dong-bo"
chcp 65001 >nul
rem #277: dung lai toan bo bai (build_units.py) vao DetPro\data\jsonData roi chep sang web. Bai co LOI thi dung lai, khong ghi gi.
cd /d "C:\Dienpham\App\DetPro-QuanTri\DetPro\noi-dung\soan"
echo [1/2] Dung bai: build_units.py -^> DetPro\data\jsonData ...
python build_units.py "C:\Dienpham\App\DetPro-QuanTri\DetPro\data\jsonData"
if errorlevel 1 (echo LOI dung bai - xem dong bao loi o tren & pause & exit /b 1)
echo [2/2] Chep sang web ...
cd /d "%~dp0..\.."
call node scripts\dong-bo-du-lieu.mjs --nguon "C:\Dienpham\App\DetPro-QuanTri\DetPro\data"
echo.
echo Xong. Day len web: bat\4-dua-len-web\1-day-len-github.bat
pause
