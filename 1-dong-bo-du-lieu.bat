@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [DetPro Next.js] Dong bo du lieu bai + logo tu SEO-PT-projectjs (chi doc, khong sua project cu)...
call node scripts\dong-bo-du-lieu.mjs --nguon "C:\Dienpham\App\SEO-PT-projectjs\client\public"
pause
