@echo off
chcp 65001 >nul
call "%~dp0_ghi-bam.bat" "0-gan-du-lieu-excel"
rem #326 GAN DU LIEU vao DetPro-WEB-DIEU-KHIEN.xlsx (Power Query) - chay 1 LAN (hoac khi Claude gui tep Excel moi)
echo DONG tep DetPro-WEB-DIEU-KHIEN.xlsx truoc khi tiep tuc.
pause
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0_gan-du-lieu-excel.ps1"
echo.
start "" "%~dp0DetPro-WEB-DIEU-KHIEN.xlsx"
pause
