[CmdletBinding()]
param([string]$ExtensionFolder,[string]$ExtensionId)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
if(!$ExtensionFolder){$picker=New-Object System.Windows.Forms.FolderBrowserDialog;$picker.Description='Select your existing EC-FIX-IT unpacked extension folder (contains manifest.json)';if($picker.ShowDialog() -ne 'OK'){exit};$ExtensionFolder=$picker.SelectedPath}
$resolvedFolder=(Resolve-Path -LiteralPath $ExtensionFolder).Path.TrimEnd('\')
$manifestPath=Join-Path $resolvedFolder 'manifest.json'
$manifest=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if($manifest.name -ne 'EC-FIX-IT' -or $manifest.manifest_version -ne 3){throw 'Selected folder is not EC-FIX-IT. Choose the folder containing its manifest.json.'}
if(!$ExtensionId){$ExtensionId=Read-Host 'Paste the extension ID from chrome://extensions or edge://extensions (32 letters)'}
$ExtensionId=$ExtensionId.Trim()
if($ExtensionId -cnotmatch '^[a-p]{32}$'){throw 'Invalid extension ID. Copy the ID from the browser extensions page with Developer mode enabled.'}
$rootInfo=New-Object System.IO.DirectoryInfo($resolvedFolder)
for($current=$rootInfo;$null -ne $current;$current=$current.Parent){if(($current.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Junction/symlink folders are not supported. Use a regular local folder.'}}
if($resolvedFolder -eq [IO.Path]::GetPathRoot($resolvedFolder).TrimEnd('\') -or $resolvedFolder -eq $env:USERPROFILE -or $resolvedFolder -eq $env:LOCALAPPDATA -or $resolvedFolder -eq $env:WINDIR){throw 'Select the specific unpacked extension folder.'}
$installRoot=Join-Path $env:LOCALAPPDATA 'EC-FIX-IT-Updater'
New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
$configPath=Join-Path $installRoot 'config.json'
if(Test-Path -LiteralPath $configPath){$previous=Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json;if($previous.extensionId -ne $ExtensionId -or $previous.extensionFolder -ne $resolvedFolder){throw 'The updater is already bound to a different installation. Unregister it before changing installations.'};$installId=$previous.installId}else{$installId=[guid]::NewGuid().ToString()}
$utf8=New-Object Text.UTF8Encoding($false)
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'EC-FIX-IT-Updater.exe') -Destination (Join-Path $installRoot 'EC-FIX-IT-Updater.exe') -Force
[IO.File]::WriteAllText((Join-Path $resolvedFolder '.ecfixit-install-id'),$installId,$utf8)
[IO.File]::WriteAllText($configPath,(@{extensionId=$ExtensionId;extensionFolder=$resolvedFolder;installId=$installId}|ConvertTo-Json),$utf8)
$hostManifest=Join-Path $installRoot 'com.ecfixit.updater.json'
[IO.File]::WriteAllText($hostManifest,(@{name='com.ecfixit.updater';description='EC-FIX-IT Windows updater';path=(Join-Path $installRoot 'EC-FIX-IT-Updater.exe');type='stdio';allowed_origins=@("chrome-extension://$ExtensionId/")}|ConvertTo-Json),$utf8)
foreach($view in @([Microsoft.Win32.RegistryView]::Registry32,[Microsoft.Win32.RegistryView]::Registry64)){
 $registry=[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser,$view)
 try{foreach($browser in @('Google\Chrome','Microsoft\Edge')){$key=$registry.CreateSubKey("Software\$browser\NativeMessagingHosts\com.ecfixit.updater");try{$key.SetValue('',$hostManifest,[Microsoft.Win32.RegistryValueKind]::String)}finally{$key.Dispose()}}}finally{$registry.Dispose()}
}
Write-Host "Updater registered for $resolvedFolder" -ForegroundColor Green
# Bootstrap the newest published extension into the existing folder, including nativeMessaging permission.
$processInfo=New-Object Diagnostics.ProcessStartInfo
$processInfo.FileName=Join-Path $installRoot 'EC-FIX-IT-Updater.exe'
$processInfo.Arguments="chrome-extension://$ExtensionId/"
$processInfo.UseShellExecute=$false;$processInfo.CreateNoWindow=$true;$processInfo.RedirectStandardInput=$true;$processInfo.RedirectStandardOutput=$true
$process=New-Object Diagnostics.Process;$process.StartInfo=$processInfo
try{
 $process.Start() | Out-Null
 $payload=$utf8.GetBytes('{"command":"update"}');$length=[BitConverter]::GetBytes([int]$payload.Length)
 $process.StandardInput.BaseStream.Write($length,0,4);$process.StandardInput.BaseStream.Write($payload,0,$payload.Length);$process.StandardInput.BaseStream.Flush();$process.StandardInput.Close()
 $reader=New-Object IO.BinaryReader($process.StandardOutput.BaseStream)
 $responseLength=$reader.ReadInt32();if($responseLength -lt 1 -or $responseLength -gt 1048576){throw 'Invalid updater response.'}
 $response=$utf8.GetString($reader.ReadBytes($responseLength)) | ConvertFrom-Json
 if(!$response.ok){throw $response.error}
 if($response.updated){Write-Host "Updated extension files to $($response.version). Backup: $($response.backup)" -ForegroundColor Green}else{Write-Host "Extension files are already at $($response.version)."}
}finally{$process.Dispose()}
Write-Host 'ONE-TIME FINAL STEP: click Reload on the browser extensions page, then reopen EC-FIX-IT. Automatic updates are enabled by default.' -ForegroundColor Yellow
Write-Host 'Keep the installation in this folder. Updates preserve the same extension ID and saved Review data.'
