# #326 Gan Power Query vao DetPro-WEB-DIEU-KHIEN.xlsx (chay 1 lan, Excel phai DONG tep truoc).
# Doc: bat\_nhat-ky-bam.csv (moi .bat tu ghi) + bat\goi\danh-sach-goi.csv (Claude ghi). Excel chi doc, khong cong cu nao ghi vao tep Excel.
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$xlsx = Join-Path $here "DetPro-WEB-DIEU-KHIEN.xlsx"
$log = Join-Path $here "_nhat-ky-bam.csv"
$goi = Join-Path $here "goi\danh-sach-goi.csv"
if (-not (Test-Path $xlsx)) { Write-Host "Khong thay $xlsx"; exit 1 }
if (-not (Test-Path $log)) { Set-Content -Encoding utf8 -Path $log -Value "Luc,Bat" }
if (-not (Test-Path $goi)) { New-Item -ItemType Directory -Force -Path (Split-Path $goi) | Out-Null; Set-Content -Encoding utf8 -Path $goi -Value "So,Ngay,Viec,TrangThai,CanBam" }
$logM = $log.Replace('"', '""'); $goiM = $goi.Replace('"', '""')
$mLan = "let`n  Nguon = Csv.Document(File.Contents(""$logM""), [Delimiter="","", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),`n  Dau = Table.PromoteHeaders(Nguon, [PromoteAllScalars=true]),`n  Kieu = Table.TransformColumnTypes(Dau, {{""Luc"", type datetime}}, ""en-US""),`n  Gom = Table.Group(Kieu, {""Bat""}, {{""Lan cuoi"", each List.Max([Luc]), type datetime}})`nin`n  Gom"
$mGoi = "let`n  Nguon = Csv.Document(File.Contents(""$goiM""), [Delimiter="","", Encoding=65001, QuoteStyle=QuoteStyle.Csv]),`n  Dau = Table.PromoteHeaders(Nguon, [PromoteAllScalars=true]),`n  Kieu = Table.TransformColumnTypes(Dau, {{""So"", Int64.Type}, {""CanBam"", Int64.Type}}),`n  Khoa = Table.AddColumn(Kieu, ""Khoa"", each ""goi-"" & Text.From([So])),`n  Noi = Table.NestedJoin(Khoa, {""Khoa""}, DP_LanBam, {""Bat""}, ""LB"", JoinKind.LeftOuter),`n  Mo = Table.ExpandTableColumn(Noi, ""LB"", {""Lan cuoi""}, {""Da bam""}),`n  Bo = Table.RemoveColumns(Mo, {""Khoa""}),`n  Xep = Table.Sort(Bo, {{""So"", Order.Descending}})`nin`n  Xep"
# ten query, M, trang, o
$ds = @(@("DP_LanBam", $mLan, "DuLieu", "A1"), @("DP_Goi", $mGoi, "Goi", "A4"))
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false
try {
  $wb = $xl.Workbooks.Open($xlsx)
  foreach ($d in $ds) { foreach ($q in @($wb.Queries)) { if ($q.Name -eq $d[0]) { $q.Delete() } } }
  foreach ($d in $ds) {
    $name = $d[0]; $sheet = $d[2]; $cell = $d[3]
    $wb.Queries.Add($name, $d[1]) | Out-Null
    $ws = $wb.Worksheets.Item($sheet)
    foreach ($lo in @($ws.ListObjects)) { $lo.Delete() }
    if ($sheet -eq "DuLieu") { $ws.Range("A1:B2").Clear() } else { $ws.Range("A4:F5").Clear() }
    $conn = "OLEDB;Provider=Microsoft.Mashup.OleDb.1;Data Source=`$Workbook`$;Location=$name;Extended Properties="""""
    $lo = $ws.ListObjects.Add(0, $conn, $true, 1, $ws.Range($cell))
    $lo.Name = $name
    $qtb = $lo.QueryTable
    $qtb.CommandType = 2
    $qtb.CommandText = "SELECT * FROM [$name]"
    $qtb.RefreshOnFileOpen = $true
    $qtb.BackgroundQuery = $false
    $qtb.AdjustColumnWidth = $false
    $qtb.Refresh($false) | Out-Null
    Write-Host ("OK  " + $name + "  -> " + $sheet + "!" + $cell + "  (" + $lo.ListRows.Count + " dong)")
  }
  $wb.Worksheets.Item("Bam").Activate()
  $wb.Save()
  $wb.Close($false)
  Write-Host "XONG. Mo DetPro-WEB-DIEU-KHIEN.xlsx - bang tu lam moi khi mo tep (Ctrl+Alt+F5 de lam moi ngay)."
} catch {
  Write-Host ("LOI: " + $_.Exception.Message)
  Write-Host "Chup man hinh gui Claude. (Nut bam o trang Bam van dung duoc binh thuong.)"
  try { $wb.Close($false) } catch {}
  $xl.Quit()
  exit 1
}
$xl.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($xl) | Out-Null
