@echo off
call "%~dp0..\_ghi-bam.bat" "2-du-lieu\0-khoi-tao-data-tu-web"
chcp 65001 >nul
rem #277 (lam 1 lan sau #275): chep du lieu bai web dang co sang DetPro-QuanTri\DetPro\data\jsonData
rem   (thu muc du lieu dung chung web + Remotion; build_units.py se ghi vao day). Chi chep tep chua co / moi hon, khong xoa gi.
echo Chep public\jsonData cua web sang C:\Dienpham\App\DetPro-QuanTri\DetPro\data\jsonData ...
robocopy "C:\Dienpham\App\DetPro\public\jsonData" "C:\Dienpham\App\DetPro-QuanTri\DetPro\data\jsonData" /E /XO /NFL /NDL /NJH /NP
if %errorlevel% GEQ 8 (echo LOI chep & pause & exit /b 1)
echo.
echo Xong. Tu nay: soan bai xong bam 2-dung-bai-va-dong-bo.bat (dung bai vao DetPro\data roi chep sang web).
pause
