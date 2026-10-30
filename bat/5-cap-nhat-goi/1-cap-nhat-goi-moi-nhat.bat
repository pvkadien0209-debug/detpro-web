@echo off
chcp 65001 >nul
call "%~dp0..\_ghi-bam.bat" "5-cap-nhat-goi\1-cap-nhat-goi-moi-nhat"
rem #326 MOT NUT cho moi goi web Claude gui: lay goi so lon nhat trong bat\goi\ -> giai nen -> ghi so -> day len web
set "GOIDIR=%~dp0..\goi"
if not exist "%GOIDIR%\goi-*.zip" (
  echo Chua co goi nao trong bat\goi\
  pause
  exit /b 1
)
set "GOI="
for /f "usebackq delims=" %%f in (`powershell -NoProfile -Command "(Get-ChildItem -Path '%GOIDIR%' -Filter 'goi-*.zip' | Sort-Object { [int]($_.BaseName -replace '\D','') } | Select-Object -Last 1).BaseName"`) do set "GOI=%%f"
if "%GOI%"=="" (
  echo Khong doc duoc ten goi.
  pause
  exit /b 1
)
echo.
echo ===== Goi moi nhat: %GOI% =====
if exist "%GOIDIR%\%GOI%.txt" type "%GOIDIR%\%GOI%.txt"
echo.
set /p OK=Giai nen %GOI% vao C:\Dienpham\App va day len web? Go y roi Enter: 
if /i not "%OK%"=="y" (
  echo Da huy, chua lam gi.
  pause
  exit /b 0
)
tar -xf "%GOIDIR%\%GOI%.zip" -C "C:\Dienpham\App"
if errorlevel 1 (
  echo LOI giai nen - chup man hinh gui Claude.
  pause
  exit /b 1
)
call "%~dp0..\_ghi-bam.bat" "%GOI%"
echo Da giai nen %GOI%. Buoc tiep: day len GitHub (Vercel tu build).
call "%~dp0..\4-dua-len-web\1-day-len-github.bat"
