# May chu nho de mo NutriViet tren Windows - dung PowerShell co san, khong can cai gi.
# Phuc vu cac file trong thu muc nay tai http://localhost:8123 roi tu mo trinh duyet.
# Dong cua so nay de tat.
$ErrorActionPreference = "Stop"
$goc = Split-Path -Parent $MyInvocation.MyCommand.Path
$cong = 8123
$diaChi = "http://localhost:$cong/"
$loai = @{
  ".html"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8"; ".css"="text/css; charset=utf-8";
  ".json"="application/json; charset=utf-8"; ".txt"="text/plain; charset=utf-8"; ".svg"="image/svg+xml";
  ".png"="image/png"; ".ico"="image/x-icon"; ".woff2"="font/woff2"; ".map"="application/json"
}
$nghe = New-Object System.Net.HttpListener
$nghe.Prefixes.Add($diaChi)
$nghe.Start()
Write-Host "NutriViet dang chay tai $diaChi"
Write-Host "Giu cua so nay mo trong luc dung app. Dong cua so de tat."
Start-Process $diaChi
while ($nghe.IsListening) {
  $ctx = $nghe.GetContext()
  try {
    $duong = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
    $file = Join-Path $goc $duong
    if (Test-Path $file -PathType Container) { $file = Join-Path $file "index.html" }
    elseif (-not (Test-Path $file -PathType Leaf) -and (Test-Path "$file.html" -PathType Leaf)) { $file = "$file.html" }
    $ma = 200
    if (-not (Test-Path $file -PathType Leaf)) { $file = Join-Path $goc "404.html"; $ma = 404 }
    $duoi = [IO.Path]::GetExtension($file).ToLower()
    $ctx.Response.ContentType = if ($loai.ContainsKey($duoi)) { $loai[$duoi] } else { "application/octet-stream" }
    $ctx.Response.StatusCode = $ma
    $byte = [IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentLength64 = $byte.Length
    $ctx.Response.OutputStream.Write($byte, 0, $byte.Length)
  } catch { $ctx.Response.StatusCode = 500 }
  finally { $ctx.Response.OutputStream.Close() }
}
