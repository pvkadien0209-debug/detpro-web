@echo off
chcp 65001 >nul
call "%~dp0_ghi-bam.bat" "0-gan-du-lieu-excel"
rem #326 -> #455 TEP NAY DA CHUYEN: bang dieu khien web nay gio la bang CHUNG C:\Dienpham\App\Web\WEB-DIEU-KHIEN.xlsx (trang DetPro).
echo Bang dieu khien web da chuyen sang: Web\WEB-DIEU-KHIEN.xlsx (moi web 1 trang).
echo Dang chay nut gan du lieu cua bang chung ...
call "%~dp0..\..\0-gan-du-lieu-excel.bat"
