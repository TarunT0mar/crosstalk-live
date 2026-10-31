const $=s=>document.querySelector(s); const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const state={active:new Set(),speaking:null,translator:null,events:[]};
const dictionary={
  "मैं शुक्रवार तक यह काम पूरा नहीं कर सकता":"I cannot finish this work by Friday.",
  "अगर पहला हिस्सा बुधवार को मिल जाए तो शुक्रवार ठीक है":"If I get the first part on Wednesday, Friday works.",
  "कीमत बहुत ज्यादा है":"The price is too high.",
  "आप मेरी बात सुन नहीं रहे हैं":"You are not listening to me.",
  "the deadline cannot move again":"समय सीमा फिर से नहीं बदल सकती।",
  "i understand the cost but i disagree with your deadline":"मैं लागत समझता हूँ, लेकिन आपकी समय सीमा से सहमत नहीं हूँ।",
  "wait let me finish":"रुकिए, मुझे अपनी बात पूरी करने दीजिए।",
  "actually i can agree if you deliver the first part tomorrow":"असल में, अगर आप पहला हिस्सा कल दे दें तो मैं सहमत हो सकता हूँ।"
};
document.querySelectorAll('.wave').forEach(w=>{for(let i=0;i<25;i++)w.append(document.createElement('i'))});
async function setupTranslator(){
  try{if('Translator'in window){const availability=await Translator.availability({sourceLanguage:'hi',targetLanguage:'en'});if(availability!=='unavailable')state.translator='native'} }catch(e){}
  $('#engineStatus').textContent=SpeechRecognition?'Speech ready · translation fallback active':'Typed demo ready · speech unsupported here';
  $('#engineStatus').parentElement.classList.add('ready');
}
function normalize(s){return s.trim().toLowerCase().replace(/[।.!?]/g,'')}
async function translate(text,from){
  const to=from.startsWith('hi')?'en':'hi';
  if(state.translator==='native')try{const t=await Translator.create({sourceLanguage:from.slice(0,2),targetLanguage:to});return await t.translate(text)}catch(e){}
  const exact=dictionary[normalize(text)]||dictionary[text.trim()]; if(exact)return exact;
  return from.startsWith('hi')?`[Demo translation] ${text}`:`[डेमो अनुवाद] ${text}`;
}
function stopVoice(interrupter){
  if(speechSynthesis.speaking){speechSynthesis.cancel();showOverlap(); const last=$('.event:last-child');if(last)last.classList.add('interrupted')}
  state.speaking=null;
}
function showOverlap(){const o=$('#overlap');o.classList.add('show');setTimeout(()=>o.classList.remove('show'),2500)}
function speak(text,lang){if(!('speechSynthesis'in window)||text.startsWith('['))return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=1.08;state.speaking=lang;u.onend=()=>state.speaking=null;speechSynthesis.speak(u)}
function addEvent(side,original,translated,wasOverlap=false){
  state.events.push({side,original,translated}); const tl=$('#timeline');if(state.events.length===1)tl.innerHTML='';
  const el=document.createElement('div');el.className='event'+(wasOverlap?' interrupted':'');el.innerHTML=`<span class="who">PERSON ${side.toUpperCase()}</span><p>${escapeHtml(original)}</p><p class="to">${escapeHtml(translated)}</p>`;tl.append(el);el.scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function submit(side,text,isFinal=true){if(!text.trim())return;const lang=$(`#lang${side.toUpperCase()}`).value;const hadOverlap=state.active.size>1||speechSynthesis.speaking; if(hadOverlap)showOverlap();
  $(`#original${side.toUpperCase()}`).textContent=text;const out=await translate(text,lang);$(`#translated${side.toUpperCase()}`).textContent=out;
  if(isFinal){addEvent(side,text,out,hadOverlap);speak(out,lang.startsWith('hi')?'en-IN':'hi-IN')}
}
function setEngine(message,ready=false){$('#engineStatus').textContent=message;$('#engineStatus').parentElement.classList.toggle('ready',ready)}
function createRecognition(side){if(!SpeechRecognition)return null;const r=new SpeechRecognition();
  // Short recognition sessions are substantially more reliable across Chrome,
  // Android and embedded browsers than an indefinitely open remote session.
  r.continuous=false;r.interimResults=true;r.maxAlternatives=1;r.lang=$(`#lang${side.toUpperCase()}`).value;
  r.onresult=e=>{let interim='',final='';for(let i=e.resultIndex;i<e.results.length;i++){(e.results[i].isFinal?final+=e.results[i][0].transcript:interim+=e.results[i][0].transcript)}if(interim)submit(side,interim,false);if(final)submit(side,final,true)};
  r.onstart=()=>setEngine('Listening · release when you finish',true);
  r.onend=()=>setEngine('Speech ready · translation fallback active',true);
  r.onerror=e=>{
    const S=side.toUpperCase();
    if(e.error==='not-allowed'||e.error==='service-not-allowed'){
      $(`#original${S}`).textContent='Microphone access is blocked. Allow it in browser settings, or type below.';
      setEngine('Microphone permission needed');
    }else if(e.error==='network'){
      $(`#original${S}`).textContent='This browser cannot reach its speech service. Open this public link in Chrome, or type below.';
      setEngine('Voice service unavailable in this browser');
    }else if(e.error!=='aborted'&&e.error!=='no-speech'){
      $(`#original${S}`).textContent='Voice could not start here. Type below to continue the demo.';
      setEngine('Typed demo remains available');
    }
  }; return r;
}
['a','b'].forEach(side=>{const S=side.toUpperCase(),card=$(`[data-side="${side}"]`),btn=$(`#talk${S}`);let r;
  const start=e=>{e.preventDefault();stopVoice(side);state.active.add(side);if(state.active.size>1)showOverlap();card.classList.add('listening');r=createRecognition(side);try{r?.start()}catch(_){} if(!r)$(`#original${S}`).textContent='Speech recognition is unavailable—type your line below.'};
  const stop=e=>{e?.preventDefault();state.active.delete(side);card.classList.remove('listening');try{r?.stop()}catch(_){}};
  btn.addEventListener('pointerdown',start);btn.addEventListener('pointerup',stop);btn.addEventListener('pointerleave',stop);
  $(`#send${S}`).onclick=()=>{stopVoice(side);const input=$(`#text${S}`);submit(side,input.value,true);input.value=''};
  $(`#text${S}`).addEventListener('keydown',e=>{if(e.key==='Enter')$(`#send${S}`).click()});
});
$('#clearBtn').onclick=()=>{state.events=[];$('#timeline').innerHTML='<div class="empty"><strong>Transcript cleared.</strong><span>Your next line starts a fresh conversation.</span></div>'};
$('#swapBtn').onclick=()=>{const a=$('#langA').value;$('#langA').value=$('#langB').value;$('#langB').value=a};
$('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('#closeHelp').onclick=()=>$('#helpDialog').close();
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
setupTranslator();
