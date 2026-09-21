# Actually starts the dev server. Kept as its own file rather than an inline
# -Command string: Task Scheduler hands its Action's argument string straight
# to CreateProcess for raw Win32 parsing, not PowerShell's own tokenizer, so
# nested quotes that work from an interactive shell get mangled there. A
# single -File path sidesteps that class of bug entirely.

$ProjectDir = Split-Path -Parent $PSScriptRoot
$LogFile = Join-Path $ProjectDir ".dev-server.log"

Set-Location $ProjectDir

$npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npmCmd) { $npmCmd = "C:\Program Files\nodejs\npm.cmd" }

# -Encoding utf8, not the *> operator's default (UTF-16LE) - keeps the log
# plain-readable instead of double-spaced binary noise in a normal editor.
& $npmCmd run dev 2>&1 | Out-File -FilePath $LogFile -Encoding utf8
