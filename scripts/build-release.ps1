[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$extensionRoot=Join-Path $repoRoot 'parameter-extension'
$helperRoot=Join-Path $repoRoot 'windows-updater'
$distRoot=Join-Path $repoRoot 'dist'
$manifest=Get-Content -LiteralPath (Join-Path $extensionRoot 'manifest.json') -Raw | ConvertFrom-Json
if($manifest.version -notmatch '^\d+\.\d+(\.\d+){0,2}$'){throw 'Invalid version'}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
& $compiler /nologo /target:exe ("/out:"+(Join-Path $helperRoot 'EC-FIX-IT-Updater.exe')) /reference:System.Web.Extensions.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll (Join-Path $helperRoot 'Updater.cs')
if($LASTEXITCODE -ne 0){throw 'Native helper compilation failed'}
New-Item -ItemType Directory -Path $distRoot -Force | Out-Null
$extensionZip=Join-Path $distRoot ("EC-FIX-IT-extension-v"+$manifest.version+'.zip')
$helperZip=Join-Path $distRoot 'EC-FIX-IT-Windows-Updater.zip'
Compress-Archive -LiteralPath $extensionRoot -DestinationPath $extensionZip -Force
Compress-Archive -Path (Join-Path $helperRoot '*') -DestinationPath $helperZip -Force
$utf8=New-Object Text.UTF8Encoding($false)
foreach($asset in @($extensionZip,$helperZip)){$hash=(Get-FileHash -LiteralPath $asset -Algorithm SHA256).Hash.ToLowerInvariant();[IO.File]::WriteAllText($asset+'.sha256',$hash+'  '+[IO.Path]::GetFileName($asset)+"`n",$utf8)}
Write-Output "Built $extensionZip and $helperZip with SHA-256 assets. Upload them to a draft release; publish only after all assets exist."
