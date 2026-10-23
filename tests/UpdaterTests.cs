using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
public class UpdaterTests {
 static void Check(bool test,string message){if(!test)throw new Exception(message);}
 static void Reject(Action fn,string text){try{fn();throw new Exception("Expected rejection: "+text);}catch(Exception e){Check(e.Message.Contains(text),e.Message);}}
 static byte[] Archive(Dictionary<string,string> files){using(var data=new MemoryStream()){using(var zip=new ZipArchive(data,ZipArchiveMode.Create,true)){foreach(var f in files){var e=zip.CreateEntry(f.Key);using(var w=new StreamWriter(e.Open(),new UTF8Encoding(false)))w.Write(f.Value);}}return data.ToArray();}}
 public static int Main(string[] args){try{
 string root=Path.Combine(Path.GetFullPath(args[0]),Guid.NewGuid().ToString("N"));Directory.CreateDirectory(root);
 var files=new Dictionary<string,string>{{"parameter-extension/manifest.json","{\"name\":\"EC-FIX-IT\",\"manifest_version\":3,\"version\":\"2.2.0\"}"},{"parameter-extension/popup.html","new popup"},{"parameter-extension/background.js","new background"},{"parameter-extension/updates.js","updates"},{"parameter-extension/native-updates.js","native"}};
 byte[] package=Archive(files);var unpacked=ECFixItUpdater.Unpack(package,"2.2.0");Check(unpacked.Count==5,"valid ZIP");
 using(var sha=SHA256.Create()){string hash=BitConverter.ToString(sha.ComputeHash(package)).Replace("-","").ToLowerInvariant();ECFixItUpdater.VerifyHash(package,hash+"  package.zip");}
 Reject(()=>ECFixItUpdater.VerifyHash(package,new string('0',64)),"checksum");
 foreach(string path in new[]{"parameter-extension/../outside.js","parameter-extension/C:/evil.js","parameter-extension/CON.txt","wrong-root/evil.js","parameter-extension/tool.exe","parameter-extension/.ecfixit-install-id"}){var bad=new Dictionary<string,string>(files);bad[path]="bad";try{ECFixItUpdater.Unpack(Archive(bad),"2.2.0");throw new Exception("Unsafe archive accepted: "+path);}catch(Exception e){if(e.Message.StartsWith("Unsafe archive accepted"))throw;}}
 Reject(()=>ECFixItUpdater.Unpack(package,"9.9.9"),"does not match");
 var assets=ECFixItUpdater.ObjectJson("{\"assets\":[{\"name\":\"sample\"}]}")["assets"];Console.WriteLine("JSON asset type: "+assets.GetType().Name);
 string install=Path.Combine(root,"install"),state=Path.Combine(root,"state");Directory.CreateDirectory(install);Directory.CreateDirectory(state);
 File.WriteAllText(Path.Combine(install,"manifest.json"),"old manifest");File.WriteAllText(Path.Combine(install,"popup.html"),"old popup");File.WriteAllText(Path.Combine(install,"obsolete.js"),"old obsolete");File.WriteAllText(Path.Combine(install,"personal.txt"),"keep");File.WriteAllText(Path.Combine(state,"installed-files.json"),"[\"manifest.json\",\"popup.html\",\"obsolete.js\"]");
 Reject(()=>ECFixItUpdater.Apply(install,state,unpacked,p=>{if(p=="manifest.json")throw new IOException("simulated locked file");}),"Previous files restored");
 Check(File.ReadAllText(Path.Combine(install,"popup.html"))=="old popup","rollback restores replaced file");Check(File.ReadAllText(Path.Combine(install,"obsolete.js"))=="old obsolete","rollback restores removed file");Check(!File.Exists(Path.Combine(install,"native-updates.js")),"rollback removes new files");Check(File.ReadAllText(Path.Combine(install,"manifest.json"))=="old manifest","rollback manifest");
 string backup=ECFixItUpdater.Apply(install,state,unpacked,null);Check(File.ReadAllText(Path.Combine(install,"popup.html"))=="new popup","apply replaces");Check(!File.Exists(Path.Combine(install,"obsolete.js")),"managed obsolete removed");Check(File.ReadAllText(Path.Combine(install,"personal.txt"))=="keep","unknown file preserved");Check(File.Exists(Path.Combine(backup,"restore-plan.json")),"backup plan");
 File.Copy(Path.Combine(backup,"restore-plan.json"),Path.Combine(state,"pending-update.json"));File.WriteAllText(Path.Combine(install,"popup.html"),"interrupted contents");ECFixItUpdater.RecoverPending(install,state);Check(File.ReadAllText(Path.Combine(install,"popup.html"))=="old popup","interrupted transaction recovery");Check(!File.Exists(Path.Combine(state,"pending-update.json")),"recovery clears journal");
 using(var data=new MemoryStream()){ECFixItUpdater.WriteFrame(data,new {command="status"});data.Position=0;Check(Encoding.UTF8.GetString(ECFixItUpdater.ReadFrame(data)).Contains("status"),"native frame roundtrip");}
 Check(ECFixItUpdater.ParseVersion("2.2")==ECFixItUpdater.ParseVersion("2.2.0"),"version normalization");Console.WriteLine("PASS: checksums, archive identity, path traversal/reserved/executable guards, native framing, backup, successful update, obsolete managed files, unrelated preservation and rollback.");return 0;
 }catch(Exception e){Console.Error.WriteLine(e);return 1;}}
}
