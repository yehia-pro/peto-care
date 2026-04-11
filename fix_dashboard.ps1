$file = "g:\Yehia - Copy\yehia project\web 3\src\pages\DoctorDashboard.tsx"
$lines = Get-Content $file
$newLines = $lines[0..580] + $lines[711..($lines.Count-1)]
$newLines | Set-Content $file -Encoding UTF8
Write-Host "Done"
