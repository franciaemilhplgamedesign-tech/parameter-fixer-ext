$ErrorActionPreference='Stop'
$installRoot=Join-Path $env:LOCALAPPDATA 'EC-FIX-IT-Updater'
$hostManifest=Join-Path $installRoot 'com.ecfixit.updater.json'
foreach($view in @([Microsoft.Win32.RegistryView]::Registry32,[Microsoft.Win32.RegistryView]::Registry64)){
 $registry=[Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser,$view)
 try{foreach($browser in @('Google\Chrome','Microsoft\Edge')){$sub="Software\$browser\NativeMessagingHosts";$parent=$registry.OpenSubKey($sub,$true);if($parent){try{$key=$parent.OpenSubKey('com.ecfixit.updater');if($key){$registered=$key.GetValue('');$key.Dispose();if($registered -eq $hostManifest){$parent.DeleteSubKey('com.ecfixit.updater')}}}finally{$parent.Dispose()}}}}finally{$registry.Dispose()}
}
$configPath=Join-Path $installRoot 'config.json'
if(Test-Path -LiteralPath $configPath){Rename-Item -LiteralPath $configPath -NewName ('config.unregistered-'+[guid]::NewGuid().ToString('N')+'.json')}
Write-Host 'Updater unregistered from Chrome and Edge. Extension files, Review data, configuration and backups were preserved. You can delete the EC-FIX-IT-Updater folder from LocalAppData when no updater process is running.'
