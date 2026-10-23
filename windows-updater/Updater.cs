using System;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading;
using System.Web.Script.Serialization;

public class ECFixItUpdater {
 public const string HostVersion="1.0.1";
 const string Repo="franciaemilhplgamedesign-tech/parameter-fixer-ext";
 const int MaxArchive=25*1024*1024,MaxExpanded=80*1024*1024;
 static JavaScriptSerializer Json=new JavaScriptSerializer { MaxJsonLength=2*1024*1024 };
 static string BaseDir=AppDomain.CurrentDomain.BaseDirectory;
 public static Dictionary<string,object> ObjectJson(string text){return Json.Deserialize<Dictionary<string,object>>(text);}
 static string Value(Dictionary<string,object> o,string key){return o.ContainsKey(key)?Convert.ToString(o[key]):"";}
 static Dictionary<string,object> Result(params object[] values){var o=new Dictionary<string,object>();for(int i=0;i<values.Length;i+=2)o[(string)values[i]]=values[i+1];return o;}
 public static byte[] ReadFrame(Stream input){byte[] length=new byte[4];ReadExactly(input,length);int n=BitConverter.ToInt32(length,0);if(n<1||n>65536)throw new Exception("Invalid native message length.");var b=new byte[n];ReadExactly(input,b);return b;}
 static void ReadExactly(Stream input,byte[] bytes){int pos=0;while(pos<bytes.Length){int n=input.Read(bytes,pos,bytes.Length-pos);if(n==0)throw new EndOfStreamException();pos+=n;}}
 public static void WriteFrame(Stream output,object value){byte[] b=Encoding.UTF8.GetBytes(Json.Serialize(value));output.Write(BitConverter.GetBytes(b.Length),0,4);output.Write(b,0,b.Length);output.Flush();}
 public static int Main(string[] args){
  Stream output=Console.OpenStandardOutput();
  try {
   var config=ObjectJson(File.ReadAllText(Path.Combine(BaseDir,"config.json")));
   string id=Value(config,"extensionId");if(!Regex.IsMatch(id,"^[a-p]{32}$")||args.Length==0||args[0].TrimEnd('/')!="chrome-extension://"+id)throw new Exception("Caller is not the configured extension.");
   var message=ObjectJson(Encoding.UTF8.GetString(ReadFrame(Console.OpenStandardInput())));string command=Value(message,"command");
   using(var mutex=new Mutex(false,"Local\\ECFixItUpdater_"+id)){
    bool owned=false;try{try{owned=mutex.WaitOne(30000);}catch(AbandonedMutexException){owned=true;}if(!owned)throw new Exception("Another update is in progress.");
     string root=ValidateInstall(config);RecoverPending(root,BaseDir);var manifest=ObjectJson(File.ReadAllText(Path.Combine(root,"manifest.json")));
     if(command=="status")WriteFrame(output,Result("ok",true,"helperVersion",HostVersion,"folder",root,"version",Value(manifest,"version")));
     else if(command=="update")WriteFrame(output,Update(config,root,manifest));else throw new Exception("Unsupported updater command.");
    }finally{if(owned)mutex.ReleaseMutex();}
   }
   return 0;
  }catch(Exception e){try{WriteFrame(output,Result("ok",false,"error",e.Message));}catch{}return 1;}
 }
 public static string ValidateInstall(Dictionary<string,object> config){
  string raw=Value(config,"extensionFolder");if(!Path.IsPathRooted(raw)||raw.StartsWith("\\\\"))throw new Exception("A local absolute extension folder is required.");
  string root=Path.GetFullPath(raw).TrimEnd(Path.DirectorySeparatorChar);if(root.Length<4||!Directory.Exists(root))throw new Exception("Extension folder is unavailable.");
  foreach(string forbidden in new[]{Path.GetPathRoot(root).TrimEnd('\\'),Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),Environment.GetFolderPath(Environment.SpecialFolder.Windows),Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),BaseDir.TrimEnd('\\')})if(String.Equals(root,forbidden,StringComparison.OrdinalIgnoreCase))throw new Exception("Choose the specific unpacked extension folder.");
  CheckLinks(root);string marker=Path.Combine(root,".ecfixit-install-id");if(!File.Exists(marker)||File.ReadAllText(marker).Trim()!=Value(config,"installId"))throw new Exception("Installation folder identity does not match. Run setup again for the correct folder.");
  var m=ObjectJson(File.ReadAllText(Path.Combine(root,"manifest.json")));if(Value(m,"name")!="EC-FIX-IT"||Value(m,"manifest_version")!="3")throw new Exception("Folder does not contain the EC-FIX-IT extension.");
  ParseVersion(Value(m,"version"));return root;
 }
 public static Version ParseVersion(string value){if(!Regex.IsMatch(value,@"^\d+\.\d+(?:\.\d+){0,2}$"))throw new Exception("Invalid release version.");var parts=value.Split('.').ToList();while(parts.Count<4)parts.Add("0");return new Version(String.Join(".",parts));}
 static void CheckLinks(string path){for(var d=new DirectoryInfo(path);d!=null;d=d.Parent){if(d.Exists&&(d.Attributes&FileAttributes.ReparsePoint)!=0)throw new Exception("Updater does not follow junctions or symbolic links: "+d.FullName);}}
 public static string Under(string root,string relative){
  if(String.IsNullOrEmpty(relative)||relative.Contains('\\')||relative.StartsWith("/")||!Regex.IsMatch(relative,@"^[a-zA-Z0-9_./-]+$"))throw new Exception("Unsafe package path.");
  foreach(string part in relative.Split('/'))if(part==""||part=="."||part==".."||part.EndsWith(".")||Regex.IsMatch(part,@"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)",RegexOptions.IgnoreCase))throw new Exception("Unsafe package path.");
  string boundary=Path.GetFullPath(root).TrimEnd('\\')+"\\",full=Path.GetFullPath(Path.Combine(root,relative.Replace('/',Path.DirectorySeparatorChar)));
  if(!full.StartsWith(boundary,StringComparison.OrdinalIgnoreCase))throw new Exception("Package path escapes the extension folder.");
  CheckLinks(Path.GetDirectoryName(full));if(File.Exists(full)&&(File.GetAttributes(full)&FileAttributes.ReparsePoint)!=0)throw new Exception("Symbolic-link file is not allowed.");return full;
 }
 public static Dictionary<string,byte[]> Unpack(byte[] bytes,string version){
  if(bytes.Length>MaxArchive)throw new Exception("Update archive is too large.");var files=new Dictionary<string,byte[]>(StringComparer.OrdinalIgnoreCase);long expanded=0;
  using(var zip=new ZipArchive(new MemoryStream(bytes),ZipArchiveMode.Read))foreach(var entry in zip.Entries){
   string entryPath=entry.FullName.Replace('\\','/');const string prefix="parameter-extension/";if(!entryPath.StartsWith(prefix,StringComparison.Ordinal))throw new Exception("Unexpected archive root.");if(entryPath.EndsWith("/"))continue;
   string relative=entryPath.Substring(prefix.Length);Under(Path.GetTempPath(),relative);
   if(relative.StartsWith(".")||Regex.IsMatch(relative,@"\.(exe|dll|ps1|cmd|bat|com|msi)$",RegexOptions.IgnoreCase))throw new Exception("Unexpected executable or configuration in extension archive.");
   if(files.ContainsKey(relative)||files.Count>=500)throw new Exception("Duplicate or excessive archive entries.");expanded+=entry.Length;if(entry.Length<0||expanded>MaxExpanded)throw new Exception("Expanded update is too large.");
   using(var input=entry.Open())using(var buffer=new MemoryStream()){byte[] chunk=new byte[8192];int n;while((n=input.Read(chunk,0,chunk.Length))>0){if(buffer.Length+n>entry.Length||buffer.Length+n>MaxExpanded)throw new Exception("Invalid archive entry size.");buffer.Write(chunk,0,n);}if(buffer.Length!=entry.Length)throw new Exception("Incomplete archive entry.");files.Add(relative,buffer.ToArray());}
  }
  if(!files.ContainsKey("manifest.json"))throw new Exception("Update manifest is missing.");var manifest=ObjectJson(Encoding.UTF8.GetString(files["manifest.json"]).TrimStart('\uFEFF'));
  if(Value(manifest,"name")!="EC-FIX-IT"||Value(manifest,"manifest_version")!="3"||Value(manifest,"version")!=version)throw new Exception("Archive name/version does not match the release.");
  foreach(string required in new[]{"popup.html","background.js","updates.js","native-updates.js"})if(!files.ContainsKey(required))throw new Exception("Incomplete extension package: "+required);
  return files;
 }
 static byte[] Download(string address,int maximum){
  Uri uri=new Uri(address);for(int redirect=0;redirect<6;redirect++){
   if(uri.Scheme!="https"||!(uri.Host=="api.github.com"||uri.Host=="github.com"||uri.Host.EndsWith(".githubusercontent.com",StringComparison.OrdinalIgnoreCase)))throw new Exception("Untrusted update download host.");
   ServicePointManager.SecurityProtocol=SecurityProtocolType.Tls12;var request=(HttpWebRequest)WebRequest.Create(uri);request.UserAgent="EC-FIX-IT-Windows-Updater/"+HostVersion;request.Accept="application/vnd.github+json";request.AllowAutoRedirect=false;request.Timeout=60000;request.ReadWriteTimeout=60000;
   using(var response=(HttpWebResponse)request.GetResponse()){
    int status=(int)response.StatusCode;if(status>=300&&status<400){uri=new Uri(uri,response.Headers["Location"]);continue;}if(status!=200)throw new Exception("GitHub returned "+status);if(response.ContentLength>maximum)throw new Exception("Download is too large.");
    using(var input=response.GetResponseStream())using(var buffer=new MemoryStream()){byte[] chunk=new byte[16384];int n;while((n=input.Read(chunk,0,chunk.Length))>0){if(buffer.Length+n>maximum)throw new Exception("Download exceeded size limit.");buffer.Write(chunk,0,n);}return buffer.ToArray();}
   }
  }throw new Exception("Too many download redirects.");
 }
 public static void VerifyHash(byte[] bytes,string checksum){string expected=checksum.Trim().Split(new[]{' ','\t','\r','\n'},StringSplitOptions.RemoveEmptyEntries)[0];if(!Regex.IsMatch(expected,"^[a-fA-F0-9]{64}$"))throw new Exception("Invalid release checksum.");using(var sha=SHA256.Create()){string actual=BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","");if(!actual.Equals(expected,StringComparison.OrdinalIgnoreCase))throw new Exception("Update checksum does not match. Files were not changed.");}}
 static Dictionary<string,object> Update(Dictionary<string,object> config,string root,Dictionary<string,object> manifest){
  var release=ObjectJson(Encoding.UTF8.GetString(Download("https://api.github.com/repos/"+Repo+"/releases/latest",2*1024*1024)));string tag=Value(release,"tag_name");if(!tag.StartsWith("v"))throw new Exception("Unexpected release tag.");string version=tag.Substring(1);
  if(ParseVersion(version)<=ParseVersion(Value(manifest,"version")))return Result("ok",true,"updated",false,"version",Value(manifest,"version"));
  string name="EC-FIX-IT-extension-v"+version+".zip";var assets=(System.Collections.IEnumerable)release["assets"];bool archive=false,checksum=false;foreach(Dictionary<string,object> asset in assets){if(Value(asset,"name")==name)archive=true;if(Value(asset,"name")==name+".sha256")checksum=true;}
  if(!archive||!checksum)throw new Exception("Latest release is not ready for automatic updates: archive or SHA-256 asset missing.");
  string baseUrl="https://github.com/"+Repo+"/releases/download/"+tag+"/";
  byte[] bytes=Download(baseUrl+name,MaxArchive);VerifyHash(bytes,Encoding.UTF8.GetString(Download(baseUrl+name+".sha256",4096)));
  var files=Unpack(bytes,version);var incoming=ObjectJson(Encoding.UTF8.GetString(files["manifest.json"]).TrimStart('\uFEFF'));if(Value(manifest,"key")!=Value(incoming,"key"))throw new Exception("Update would change the extension identity key.");string backup=Apply(root,BaseDir,files,null);
  return Result("ok",true,"updated",true,"version",version,"backup",backup,"files",files.Count);
 }
 static void AtomicWrite(string file,byte[] content){Directory.CreateDirectory(Path.GetDirectoryName(file));string temp=file+".ecupdate-"+Guid.NewGuid().ToString("N");try{File.WriteAllBytes(temp,content);if(File.Exists(file))File.Replace(temp,file,null);else File.Move(temp,file);}finally{if(File.Exists(temp))File.Delete(temp);}}
 public static string Apply(string root,string state,Dictionary<string,byte[]> files,Action<string> beforeWrite){
  root=Path.GetFullPath(root);CheckLinks(root);string inventory=Path.Combine(state,"installed-files.json");var previous=File.Exists(inventory)?Json.Deserialize<string[]>(File.ReadAllText(inventory)):new string[0];
  var affected=files.Keys.Concat(previous).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();foreach(string relative in affected){string target=Under(root,relative);if(Directory.Exists(target))throw new Exception("A directory occupies a package file path.");}
  string backup=Path.Combine(state,"backups",DateTime.UtcNow.ToString("yyyyMMdd-HHmmss")+"-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(backup);var existed=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
  foreach(string relative in affected){string source=Under(root,relative);if(File.Exists(source)){string dest=Under(backup,relative);Directory.CreateDirectory(Path.GetDirectoryName(dest));File.Copy(source,dest);existed.Add(relative);}}
  var plan=Result("root",root,"backup",backup,"affected",affected,"existed",existed.ToArray(),"previous",previous,"hadInventory",File.Exists(inventory));
  byte[] planBytes=Encoding.UTF8.GetBytes(Json.Serialize(plan));AtomicWrite(Path.Combine(backup,"restore-plan.json"),planBytes);AtomicWrite(Path.Combine(state,"pending-update.json"),planBytes);
  var touched=new List<string>();
  try{
   foreach(string relative in files.Keys.Where(k=>!k.Equals("manifest.json",StringComparison.OrdinalIgnoreCase))){touched.Add(relative);if(beforeWrite!=null)beforeWrite(relative);AtomicWrite(Under(root,relative),files[relative]);}
   foreach(string relative in previous.Where(k=>!files.ContainsKey(k))){touched.Add(relative);string target=Under(root,relative);if(File.Exists(target))File.Delete(target);}
   touched.Add("manifest.json");if(beforeWrite!=null)beforeWrite("manifest.json");AtomicWrite(Under(root,"manifest.json"),files["manifest.json"]);
   AtomicWrite(inventory,Encoding.UTF8.GetBytes(Json.Serialize(files.Keys.ToArray())));File.Delete(Path.Combine(state,"pending-update.json"));return backup;
  }catch(Exception failure){
   try{RecoverPending(root,state);}catch(Exception recovery){throw new Exception("Update failed: "+failure.Message+" Rollback incomplete: "+recovery.Message+" Backup: "+backup);}
   throw new Exception("Update failed: "+failure.Message+" Previous files restored. Backup: "+backup);
  }
 }
 public static void RecoverPending(string root,string state){
  string journal=Path.Combine(state,"pending-update.json");if(!File.Exists(journal))return;
  var plan=ObjectJson(File.ReadAllText(journal));string backup=Value(plan,"backup"),expected=Path.GetFullPath(Path.Combine(state,"backups"));
  if(!String.Equals(Path.GetFullPath(Value(plan,"root")),Path.GetFullPath(root),StringComparison.OrdinalIgnoreCase)||!String.Equals(Path.GetDirectoryName(Path.GetFullPath(backup)),expected,StringComparison.OrdinalIgnoreCase))throw new Exception("Recovery paths do not match the configured installation.");CheckLinks(backup);
  Func<string,string[]> values=key=>((System.Collections.IEnumerable)plan[key]).Cast<object>().Select(x=>Convert.ToString(x)).ToArray();
  var existed=new HashSet<string>(values("existed"),StringComparer.OrdinalIgnoreCase);
  foreach(string relative in values("affected").Reverse()){string target=Under(root,relative);if(existed.Contains(relative))AtomicWrite(target,File.ReadAllBytes(Under(backup,relative)));else if(File.Exists(target))File.Delete(target);}
  string inventory=Path.Combine(state,"installed-files.json");if(Convert.ToBoolean(plan["hadInventory"]))AtomicWrite(inventory,Encoding.UTF8.GetBytes(Json.Serialize(values("previous"))));else if(File.Exists(inventory))File.Delete(inventory);
  File.Delete(journal);
 }

}
