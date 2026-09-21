# Registers the Next.js dev server as a Windows Scheduled Task so it survives
# closing the terminal AND a reboot - it restarts at your next logon.
#
# Local-only: still http://localhost:3000, not reachable from another machine.
# For that, deploy to Vercel instead (the stack's actual production target).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\dev-service.ps1          # install + start
#   powershell -ExecutionPolicy Bypass -File scripts\dev-service.ps1 -Remove  # uninstall

param([switch]$Remove)

$TaskName = "ServeAndBeyond-DevServer"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$RunnerScript = Join-Path $PSScriptRoot "run-dev-hidden.ps1"
$LogFile = Join-Path $ProjectDir ".dev-server.log"

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task."
}

if ($Remove) {
    Write-Host "Task removed. Port 3000 stays free until you start it manually."
    exit
}

# -File with a single path, not -Command with an inline script: Task
# Scheduler's Action argument goes through raw Win32 command-line parsing,
# not PowerShell's tokenizer, and nested quotes broke there even though the
# identical string worked fine typed into an interactive shell.
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -File `"$RunnerScript`""

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
    -Description "Runs 'npm run dev' for Serve & Beyond at logon so localhost:3000 survives closing the terminal and a reboot." | Out-Null

Write-Host "Installed. Starting it now (it will also auto-start at every future logon)..."
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 6
Write-Host "Check http://localhost:3000 - log at $LogFile"
Write-Host "To remove: powershell -ExecutionPolicy Bypass -File scripts\dev-service.ps1 -Remove"
