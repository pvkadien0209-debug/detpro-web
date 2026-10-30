@echo off
rem #326 ghi 1 dong vao so bam bat\_nhat-ky-bam.csv (thoi gian,ma bat) - bang Excel doc so nay
powershell -NoProfile -Command "$f='%~dp0_nhat-ky-bam.csv'; if (-not (Test-Path $f)) { Set-Content -Encoding utf8 -Path $f -Value 'Luc,Bat' }; Add-Content -Encoding utf8 -Path $f -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ',' + '%~1')" >nul 2>&1
exit /b 0
