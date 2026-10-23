$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$testRoot=Join-Path $repoRoot 'dist\tests'
New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$testExe=Join-Path $testRoot 'UpdaterTests.exe'
& $compiler /nologo /target:exe /main:UpdaterTests ("/out:"+$testExe) /reference:System.Web.Extensions.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll (Join-Path $repoRoot 'windows-updater\Updater.cs') (Join-Path $repoRoot 'tests\UpdaterTests.cs')
if($LASTEXITCODE -ne 0){throw 'Test compilation failed'}
& $testExe (Join-Path $testRoot 'fixtures')
if($LASTEXITCODE -ne 0){throw 'Native updater tests failed'}
Push-Location $repoRoot
try{foreach($test in @('tests/test-native-protocol.js','tests/test-native-updates.js')){node $test;if($LASTEXITCODE -ne 0){throw "Failed: $test"}}}finally{Pop-Location}
Write-Output 'Updater tests passed. No browser registration or installed-extension modification was performed.'
