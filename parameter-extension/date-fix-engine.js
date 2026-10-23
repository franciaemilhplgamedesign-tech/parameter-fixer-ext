function fixSipHtml(html) {
  if(/\.get\(\s*["']date["']\s*\)/.test(html) && !/function\s+resolveSipEffectiveDate\s*\(/.test(html) && !html.includes('creative-mip-date-override-v1')){
    return {html,changed:false,native:true,message:'Native date parameter reader detected. Existing implementation preserved; no date patch needed.'};
  }
  if (/<script\b[^>]*id=["'](?:sip-preview-date-override-v1|creative-mip-date-override-v1)["']/.test(html)) {
    return {html, changed:false, message:'This file already has the date override patch.'};
  }
  // These MIP exports decode their compressed end card for React's srcDoc.
  const mipSlot = /\bsrcDoc\s*:\s*([A-Za-z_$][\w$]*(?:\(\))?)\s*,\s*title\s*:\s*["']End Scene["']/g;
  let endcards=0;
  let gameplayDates=0;
  const gameplayPatched=html.replace(/new Intl\.DateTimeFormat\([^;\n]*?\)\.format\(\s*new Date(?:\(\s*\))?\s*\)/g,match=>{
    gameplayDates++;return match.replace(/new Date(?:\(\s*\))?(?=\s*\)$)/,'window.__sipPreviewNow()');
  });
  let mipPatched=gameplayPatched.replace(mipSlot, (match, call)=>{
    endcards++;return match.replace(call,'window.__creativePatchEndcard('+call+')');
  });
  // Builder exports route decoded HTML through the existing end-card bridge.
  // Wrap its result at the call site, preserving bridge setup and clickthrough.
  mipPatched=mipPatched.replace(/window\.__eccFrameDocument\(\w+,\(\w+(?:\(\w+\))?\)\)/g,call=>{
    endcards++;return 'window.__creativePatchEndcard('+call+')';
  });
  if(endcards){
    if(!/<head\b[^>]*>/i.test(html))throw new Error('Missing HTML head. No file was changed.');
    const runtime = '('+function installMipDatePreview(patchHtml) {
      var value=new URLSearchParams(window.location.search).get('date'),preview=null;
      if(value && /^\d{4}-\d{2}-\d{2}$/.test(value)){
        var parts=value.split('-').map(Number),candidate=new Date(0);
        candidate.setFullYear(parts[0],parts[1]-1,parts[2]);candidate.setHours(12,0,0,0);
        if(candidate.getFullYear()===parts[0] && candidate.getMonth()===parts[1]-1 && candidate.getDate()===parts[2])preview=candidate;
      }
      window.__sipPreviewNow=function(){return preview?new Date(preview.getTime()):new Date();};
      window.__creativePatchEndcard=function(decoded){
        // Embedded gameplay without calendar helpers may use the same bridge.
        if(!/function\s+resolveSipEffectiveDate\s*\(/.test(decoded))return decoded;
        return patchHtml(decoded).html;
      };
    }.toString()+')('+fixSipHtml.toString()+');';
    const injection='<script id="creative-mip-date-override-v1">'+runtime.replace(/<\/script/gi,'<\\/script')+'</script>';
    return {html:mipPatched.replace(/<head\b[^>]*>/i,match=>match+'\n'+injection),changed:true,
      message:`Patched ${endcards} MIP HTML loader calls and ${gameplayDates} gameplay date displays. The preview date applies to supported dynamic dates inside the end cards${gameplayDates ? ' and gameplay' : ''}.`};
  }
  const scripts = /(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi;
  let clockCount=0, rangeCount=0, helperFound=false;
  const patched = html.replace(scripts, (whole, open, code, close) => {
    if (/\btype\s*=\s*["']application\/json["']/i.test(open) || /\bsrc\s*=/i.test(open)) return whole;
    if (!/function\s+resolveSipEffectiveDate\s*\(/.test(code)) return whole;
    helperFound=true;
    code = code.replace(/resolveSipEffectiveDate\(\s*Date\.now\(\)\s*,/g, () => {
      clockCount++; return 'resolveSipEffectiveDate(window.__sipPreviewNow().getTime(),';
    });
    code = code.replace(/resolveSipDateRangeText\(\s*dateRanges\s*,\s*new Date\(\)\s*,\s*dateRangeDefaultText\s*\)/g, () => {
      rangeCount++; return 'resolveSipDateRangeText(dateRanges, window.__sipPreviewNow(), dateRangeDefaultText)';
    });
    return open+code+close;
  });
  if (!helperFound || !clockCount) {
    if (/data:video\/mp4;base64,/.test(html) && /srcPortrait\s*:/.test(html) && /srcLandscape\s*:/.test(html) && !/resolveSipEffectiveDate|Intl\.DateTimeFormat|toLocaleDateString/.test(html)) {
      return {html,changed:false,message:'No dynamic calendar date found. This MIP uses portrait and landscape video end cards. A ?date= parameter cannot change text inside an MP4. No file was changed. To enable date previews, add a live HTML date overlay to the end card.'};
    }
    throw new Error('Unsupported export structure: expected SIP dynamic date helpers or a MIP End Scene srcDoc loader. No file was changed.');
  }
  const override = `<script id="sip-preview-date-override-v1">
(function () {
  var search = window.location.search;
  try { if (!search && window.parent && window.parent !== window) search = window.parent.location.search; } catch (_) {}
  var value = new URLSearchParams(search).get('date');
  var preview = null;
  if (value && /^\\d{4}-\\d{2}-\\d{2}$/.test(value)) {
    var parts = value.split('-').map(Number);
    var candidate = new Date(0);
    candidate.setFullYear(parts[0], parts[1] - 1, parts[2]);
    candidate.setHours(12, 0, 0, 0);
    if (candidate.getFullYear() === parts[0] && candidate.getMonth() === parts[1] - 1 && candidate.getDate() === parts[2]) preview = candidate;
  }
  window.__sipPreviewNow = function () {
    return preview ? new Date(preview.getTime()) : new Date();
  };
})();
</script>`;
  const head = /<head\b[^>]*>/i;
  if (!head.test(patched)) throw new Error('Missing HTML head. No file was changed.');
  return {html:patched.replace(head, match => match+'\n'+override), changed:true,
    message:`Patched ${clockCount} date clock calls and ${rangeCount} holiday lookups. Holiday schedules and midnight timers are preserved.`};
}
if (typeof module !== 'undefined') module.exports = {fixSipHtml};
