function populateRangeDropdown(select, ranges) {
  const previous=select.value;
  // One entry per exact date range, regardless of iteration or promo name.
  ranges=Array.from(new Map(ranges.map(r=>[r.start+'|'+r.end,r])).values())
    .sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));
  select.replaceChildren();
  const placeholder=document.createElement('option');placeholder.value='';
  placeholder.textContent=ranges.length?'Select a holiday / promo ('+ranges.length+')':'No holiday / promo ranges detected';
  select.appendChild(placeholder);
  const seen=new Set();
  for(const range of ranges){
    const value=JSON.stringify([range.start,range.end]);
    if(seen.has(value))continue;seen.add(value);
    const option=document.createElement('option');option.value=value;
    option.textContent=range.start+(range.end===range.start?'':' → '+range.end);
    select.appendChild(option);
  }
  select.disabled=!ranges.length;
  if([...select.options].some(option=>option.value===previous))select.value=previous;
  if(select.onRangesUpdated)select.onRangesUpdated();
}
function connectRangeNavigation(select,previous,next,dateInput) {
  function sync(){
    const count=select.options.length-1,index=select.selectedIndex;
    previous.disabled=select.disabled || index<=1;
    next.disabled=select.disabled || count<1 || index>=count;
  }
  function move(direction){
    const count=select.options.length-1;
    if(select.disabled || !count)return;
    const index=select.selectedIndex;
    const target=index<1?1:index+direction;
    if(target<1 || target>count)return;
    select.selectedIndex=target;
    select.dispatchEvent(new Event('change',{bubbles:true}));sync();
  }
  previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  select.addEventListener('change',sync);
  select.onRangesUpdated=()=>{
    // Recover the current range after applying a date reloads the preview.
    if(!select.value && dateInput.value){
      const options=[...select.options];
      const match=options.findIndex(option=>{if(!option.value)return false;const [start,end]=JSON.parse(option.value);return start<=dateInput.value && dateInput.value<=end;});
      if(match>0)select.selectedIndex=match;
    }
    sync();
  };
  sync();
}
function connectRangePicker(select,dateInput,onChange=()=>{}) {
  function update(){
    if(!select.value)return;
    const [start,end]=JSON.parse(select.value),previous=dateInput.value;
    if(!previous || previous<start || previous>end)dateInput.value=start;
    if(dateInput.value!==previous)onChange();
  }
  select.addEventListener('change',update);
  dateInput.addEventListener('change',()=>{
    const date=dateInput.value;
    const index=[...select.options].findIndex(option=>{
      if(!option.value || !date)return false;
      const [start,end]=JSON.parse(option.value);return start<=date && date<=end;
    });
    select.selectedIndex=index>0?index:0;
    if(select.onRangesUpdated)select.onRangesUpdated();
  });
}
