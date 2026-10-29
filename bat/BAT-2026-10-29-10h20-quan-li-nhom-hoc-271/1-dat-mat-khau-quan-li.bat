@echo off
chcp 65001 >nul
echo === Dat mat khau trang quan ly nhom hoc (/quanlinhomhoc) ===
echo Mat khau luu vao C:\Dienpham\App\DetPro\.env.local (KHONG day len GitHub).
echo Go mat khau (it nhat 8 ky tu, chu khong dau). Man hinh se KHONG hien chu ban go.
powershell -NoProfile -Command "$p = Read-Host 'Mat khau quan ly' -AsSecureString; $s = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p)); if ($s.Length -lt 8) { Write-Host 'Qua ngan - can it nhat 8 ky tu. Chua luu.'; exit 1 }; $f = 'C:\Dienpham\App\DetPro\.env.local'; $l = @(); if (Test-Path $f) { $l = @(Get-Content $f | Where-Object { $_ -notmatch '^QUANLI_MATKHAU=' }) }; $l += ('QUANLI_MATKHAU=' + $s); [IO.File]::WriteAllLines($f, [string[]]$l); Write-Host 'Da luu vao .env.local'"
echo.
echo BUOC CON LAI (lam 1 lan): dat CUNG mat khau tren Vercel
echo   vercel.com ^> du an detpro-web ^> Settings ^> Environment Variables
echo   Name: QUANLI_MATKHAU   Value: (mat khau vua go)   ^> Save
echo   Roi bam tiep 2-cap-nhat-web.bat (Vercel build lai se nhan bien moi).
pause
