importScripts('updates.js');
async function scheduleUpdateChecks(){
 await chrome.alarms.create('github-update-check',{periodInMinutes:360});
 await checkExtensionUpdate();
}
chrome.runtime.onInstalled.addListener(scheduleUpdateChecks);
chrome.runtime.onStartup.addListener(scheduleUpdateChecks);
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='github-update-check')checkExtensionUpdate();});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(sender.id!==chrome.runtime.id || message?.type!=='check-extension-update')return;
 checkExtensionUpdate().then(respond).catch(error=>respond({error:error.message}));return true;
});
