$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $pid = $conn.OwningProcess
    Write-Output "Killing PID $pid on port 3000"
    Stop-Process -Id $pid -Force
} else {
    Write-Output "No listener on port 3000"
}
