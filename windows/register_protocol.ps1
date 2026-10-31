<#
.SYNOPSIS
    Registers the Brightloop custom URL protocol (brightloop://) in the Windows Registry.
.DESCRIPTION
    Registers the URI scheme handler in HKEY_CURRENT_USER\Software\Classes\brightloop,
    pointing to brightloop_desktop_client.py using the active Python executable.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ClientScript = Join-Path $ScriptDir "brightloop_desktop_client.py"

# Detect Python executable
$PythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $PythonPath) {
    $PythonPath = "python.exe"
}

Write-Host "[*] Registering 'brightloop://' protocol handler..." -ForegroundColor Cyan
Write-Host "    Python: $PythonPath"
Write-Host "    Target Script: $ClientScript"

$ProtocolKey = "HKCU:\Software\Classes\brightloop"
$CommandKey = "$ProtocolKey\shell\open\command"

# Create registry keys
New-Item -Path $ProtocolKey -Force | Out-Null
Set-ItemProperty -Path $ProtocolKey -Name "(default)" -Value "URL:Brightloop Protocol"
Set-ItemProperty -Path $ProtocolKey -Name "URL Protocol" -Value ""

New-Item -Path $CommandKey -Force | Out-Null
$CommandValue = "`"$PythonPath`" `"$ClientScript`" `"%1`""
Set-ItemProperty -Path $CommandKey -Name "(default)" -Value $CommandValue

Write-Host "[SUCCESS] Protocol 'brightloop://' successfully registered in Windows!" -ForegroundColor Green
Write-Host "          Browser clicks on 'Open in App' will now launch the Brightloop Desktop Client." -ForegroundColor Yellow
