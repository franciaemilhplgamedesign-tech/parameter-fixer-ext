// Dependency-free ZIP (stored entries): keeps the fixer usable offline.
function makeZip(entries) {
  const encoder=new TextEncoder(),parts=[],central=[];let offset=0;
  const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  function header(size){const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};}
  for(const entry of entries){
    const name=encoder.encode(entry.name),data=entry.data instanceof Uint8Array?entry.data:encoder.encode(entry.text);
    let crc=0xffffffff;for(const b of data)crc=table[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
    if(offset+data.length>0xffffffff || entries.length>65535)throw new Error('Batch exceeds ZIP size limits. Select fewer files.');
    const local=header(30);local.view.setUint32(0,0x04034b50,true);local.view.setUint16(4,20,true);local.view.setUint16(6,0x800,true);local.view.setUint16(12,33,true);local.view.setUint32(14,crc,true);local.view.setUint32(18,data.length,true);local.view.setUint32(22,data.length,true);local.view.setUint16(26,name.length,true);
    parts.push(local.bytes,name,data);
    const dir=header(46);dir.view.setUint32(0,0x02014b50,true);dir.view.setUint16(4,20,true);dir.view.setUint16(6,20,true);dir.view.setUint16(8,0x800,true);dir.view.setUint16(14,33,true);dir.view.setUint32(16,crc,true);dir.view.setUint32(20,data.length,true);dir.view.setUint32(24,data.length,true);dir.view.setUint16(28,name.length,true);dir.view.setUint32(42,offset,true);
    central.push(dir.bytes,name);offset+=30+name.length+data.length;
  }
  const centralSize=central.reduce((sum,p)=>sum+p.length,0),end=header(22);
  end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,entries.length,true);end.view.setUint16(10,entries.length,true);end.view.setUint32(12,centralSize,true);end.view.setUint32(16,offset,true);
  return new Blob([...parts,...central,end.bytes],{type:'application/zip'});
}
