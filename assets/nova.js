/* Nova, Episode 1: page behaviour. Spliced from cmo-design's landing.js (word masks, reveals, one-shot
   stories, scroll-linked values, pointer depth, loops that pause off screen) plus the film's own parts:
   the player with its ambient light, the stills lightbox, the story stage and the four craft stories.
   Every block is guarded, so the page reads fully without JavaScript. */
(function(){
var d=document,root=d.documentElement;root.classList.add('js');
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* the screen height, held still while a browser's toolbars slide in and out as you scroll (iPhone Chrome,
   Instagram's browser and others resize the page then, which made everything sized from it jump): measured
   once, and again only when the width changes (a turn of the phone), or on any resize with a mouse */
var VH=innerHeight,vw0=innerWidth,FINE=matchMedia('(pointer: fine)').matches;
function holdVH(){VH=innerHeight;root.style.setProperty('--vh',VH/100+'px')}holdVH();
addEventListener('resize',function(){if(FINE||innerWidth!==vw0){vw0=innerWidth;holdVH()}});
function $(s,c){return (c||d).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
function ease(k,p){return 1-Math.pow(1-k,p||4)}
function tween(dur,fn){var t0=performance.now();dur=RM?1:dur;(function f(n){var k=Math.min(1,(n-t0)/dur);fn(k);if(k<1)requestAnimationFrame(f)})(t0)}

/* split headlines into masked words */
$$('[data-split]').forEach(function(h){var i=0;
 function walk(node){Array.prototype.slice.call(node.childNodes).forEach(function(c){
  if(c.nodeType===3){var frag=d.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){frag.appendChild(d.createTextNode(' '));return}
   var m=d.createElement('span');m.className='wm';var x=d.createElement('span');x.className='wi';x.style.setProperty('--i',i++);x.textContent=w;m.appendChild(x);frag.appendChild(m)});c.parentNode.replaceChild(frag,c)}
  else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})}
 walk(h)});
requestAnimationFrame(function(){requestAnimationFrame(function(){var h=$('#h1');if(h)h.classList.add('split-in')})});

/* reveals: once, with a sibling stagger capped at 270ms inside grids */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;t.classList.add('in','split-in');io.unobserve(t)})},{threshold:.18,rootMargin:'0px 0px -6% 0px'});
$$('[data-r],[data-split]:not(#h1)').forEach(function(el){var p=el.parentElement,grid=p&&(p.classList.contains('stills')||p.classList.contains('cards')||p.classList.contains('dls')),sib=grid?[].indexOf.call(p.children,el):0;
 el.style.transitionDelay=(grid?Math.min((sib%4)*90,270):0)+'ms';io.observe(el)});

/* ---------------- the film ---------------- */
/* the film's light around the screen: the picture drawn into a 24 x 42 canvas. On a desktop a CSS blur
   softens it; a phone's graphics chip falls behind re-blurring the whole screen every frame (the light lagged
   the cuts), so on touch screens the script blurs and saturates those 1,008 pixels itself and the canvas is
   shown as it is, with no CSS filter */
var film=$('#film'),video=$('#video'),play=$('#play'),amb=$('#ambient'),SOFT=matchMedia('(pointer: coarse)').matches,
 actx=amb&&amb.getContext('2d',SOFT?{willReadFrequently:true}:undefined),ambT=0,filmOn=false;
if(SOFT&&amb)amb.classList.add('soft');
function paintAmbient(src){if(!actx)return;try{actx.drawImage(src,0,0,amb.width,amb.height);if(SOFT)soften()}catch(e){}}
function soften(){var w=amb.width,h=amb.height,im=actx.getImageData(0,0,w,h),a=im.data,t=new Float32Array(w*h*3),u=new Float32Array(w*h*3),R=4,x,y,c,i,k,s,n,q;
 for(i=0;i<w*h;i++){t[i*3]=a[i*4];t[i*3+1]=a[i*4+1];t[i*3+2]=a[i*4+2]}
 /* three box passes each way approach a gaussian (sigma about 4.5 canvas pixels, the CSS blur's reach) */
 for(q=0;q<3;q++){
  for(y=0;y<h;y++)for(c=0;c<3;c++)for(x=0;x<w;x++){s=0;n=0;for(k=-R;k<=R;k++){i=x+k;if(i<0)i=0;else if(i>=w)i=w-1;s+=t[(y*w+i)*3+c];n++}u[(y*w+x)*3+c]=s/n}
  for(x=0;x<w;x++)for(c=0;c<3;c++)for(y=0;y<h;y++){s=0;n=0;for(k=-R;k<=R;k++){i=y+k;if(i<0)i=0;else if(i>=h)i=h-1;s+=u[(i*w+x)*3+c];n++}t[(y*w+x)*3+c]=s/n}}
 for(i=0;i<w*h;i++){var r=t[i*3],g=t[i*3+1],b=t[i*3+2],l=.2126*r+.7152*g+.0722*b;a[i*4]=l+(r-l)*1.4;a[i*4+1]=l+(g-l)*1.4;a[i*4+2]=l+(b-l)*1.4;a[i*4+3]=255}
 actx.putImageData(im,0,0)}
if(video){
 video.controls=false;
 var poster=new Image();poster.onload=function(){paintAmbient(poster)};poster.src=video.getAttribute('poster');
 /* the stream: three qualities (4K, 1080p, 720p; Auto by default) and two mixes (Stereo, and Binaural for
    headphones) from assets/hls/. hls.js where the browser has Media Source; Safari's own HLS where it has not
    (sound only there: it picks the quality itself). With neither, or no stream on the server, the MP4 plays and
    the pills stay hidden. Nothing loads until Play; the choices are remembered on this device. */
 var SRC='assets/hls/master.m3u8',opts=$('#filmOpts'),qSel=$('#qSel'),sSel=$('#sSel'),hint=$('#optHint'),hls=null,native=false,loaded=false,fixes=0,autoAt='';
 function pref(k,v){try{if(v==null)return localStorage.getItem('nova.'+k);localStorage.setItem('nova.'+k,v)}catch(e){return null}}
 var Q=pref('q')||'auto',SND=pref('snd')==='binaural'?'binaural':'stereo';
 function qName(h){return h>=2160?'4K':h+'p'}
 function side(l){return Math.min(l.width||l.height,l.height)}   /* a vertical film is named by its short side: 1080p is 1080 × 1920 */
 function label(){
  if(qSel.options[0])qSel.options[0].text='Auto'+(autoAt?' · '+autoAt:'');
  $('#qVal').textContent=Q==='auto'?'Auto'+(autoAt?' · '+autoAt:''):qName(+Q);
  $('#sVal').textContent=SND==='binaural'?'Binaural':'Stereo';$('#sOpt').classList.toggle('on',SND==='binaural');
  hint.textContent=SND==='binaural'?'Binaural is mixed for headphones.':'Headphones on? Binaural puts the sound around you.'}
 function levelIdx(v){if(!hls||v==='auto')return -1;for(var i=0;i<hls.levels.length;i++)if(side(hls.levels[i])===+v)return i;return -1}
 function setQ(v,save){if(!hls||!hls.levels||!hls.levels.length)return;var i=levelIdx(v);if(i<0)v='auto';Q=v;qSel.value=v;if(save)pref('q',v);
  if(loaded)hls.currentLevel=i;else{hls.startLevel=i;hls.loadLevel=i}label()}
 function trackIdx(list,v,name){for(var i=0;i<list.length;i++)if(/binaural/i.test(name(list[i]))===(v==='binaural'))return i;return -1}
 function setS(v,save){SND=v;sSel.value=v;if(save)pref('snd',v);
  if(hls){var i=trackIdx(hls.audioTracks||[],v,function(t){return t.name||''});if(i>=0&&hls.audioTrack!==i)hls.audioTrack=i}
  else if(native&&video.audioTracks){var at=video.audioTracks,j=trackIdx(at,v,function(t){return t.label||''});if(j>=0)for(var k=0;k<at.length;k++)at[k].enabled=k===j}
  label()}
 function ready(){opts.hidden=false;film.classList.add('has-opts');label()}
 function drop4k(){var o=qSel.querySelector('option[value="2160"]');if(o)o.remove();if(hls){var c=levelIdx('1080');if(c>=0)hls.autoLevelCapping=c}if(Q==='2160')setQ('auto')}
 /* back to the progressive file, from where the stream stopped */
 function mp4(){var t=video.currentTime||0,was=!video.paused&&!video.ended;
  if(hls){try{hls.destroy()}catch(e){}hls=null}
  native=false;video.src='assets/nova-ep1-david-goliath.mp4';   /* explicit: hls.js can leave a revoked blob: behind */
  opts.hidden=true;film.classList.remove('has-opts');video.preload='metadata';try{video.load()}catch(e){}
  if(t>0||was)video.addEventListener('loadedmetadata',function f(){video.removeEventListener('loadedmetadata',f);if(t>0){try{video.currentTime=t}catch(e){}}if(was){var p=video.play();if(p&&p.catch)p.catch(function(){})}})}
 function useHls(){var E=Hls.Events,dying=false;
  function bail(){if(dying)return;dying=true;setTimeout(mp4,0)}
  hls=new Hls({autoStartLoad:false,capLevelToPlayerSize:true,abrEwmaDefaultEstimate:8e6,maxBufferLength:30,maxMaxBufferLength:60,backBufferLength:30});
  hls.on(E.MANIFEST_PARSED,function(){
   var ls=hls.levels.slice().sort(function(a,b){return side(b)-side(a)});
   qSel.innerHTML='';[['auto','Auto']].concat(ls.map(function(l){return [String(side(l)),qName(side(l))+' · '+l.width+' × '+l.height]})).forEach(function(o){var e=d.createElement('option');e.value=o[0];e.textContent=o[1];qSel.appendChild(e)});
   /* a phone that cannot decode the 4K picture never gets offered it */
   var l4=hls.levels.filter(function(l){return side(l)>=2160})[0],mc=navigator.mediaCapabilities;
   if(l4&&mc&&mc.decodingInfo)mc.decodingInfo({type:'media-source',video:{contentType:'video/mp4; codecs="'+(l4.videoCodec||'avc1.640033')+'"',width:l4.width,height:l4.height,bitrate:l4.bitrate,framerate:24}}).then(function(r){if(!r.supported)drop4k()}).catch(function(){});
   setQ(Q);setS(SND);ready()});
  hls.on(E.AUDIO_TRACKS_UPDATED,function(){setS(SND)});
  hls.on(E.LEVEL_SWITCHED,function(e,x){var l=hls.levels[x.level];autoAt=l?qName(side(l)):'';label()});
  hls.on(E.ERROR,function(e,x){if(!x.fatal||dying)return;
   /* 2: a browser that cannot play the stream's codecs at all goes straight to the MP4 */
   if(x.details===Hls.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR){bail();return}
   if(x.type===Hls.ErrorTypes.MEDIA_ERROR&&fixes++<2){if(Q==='2160')drop4k();hls.recoverMediaError();return}
   if(x.type===Hls.ErrorTypes.NETWORK_ERROR&&loaded&&fixes++<3){hls.startLoad();return}
   bail()});
  hls.loadSource(SRC);hls.attachMedia(video)}
 function useNative(){native=true;video.src=SRC;$('#qOpt').hidden=true;
  video.addEventListener('loadedmetadata',function(){if(native)setS(SND)});
  if(video.audioTracks&&video.audioTracks.addEventListener)video.audioTracks.addEventListener('addtrack',function(){if(native)setS(SND)});
  video.addEventListener('error',function(){if(native)mp4()});ready()}
 function load(at){if(hls&&!loaded){setQ(Q);loaded=true;hls.startLoad(at==null?-1:at);return true}return false}
 if(qSel&&sSel&&location.protocol!=='file:'){
  qSel.addEventListener('change',function(){setQ(qSel.value,true)});
  sSel.addEventListener('change',function(){setS(sSel.value,true)});
  /* a look at the playlist first, so a missing stream never costs a click */
  fetch(SRC,{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(t){
   if(t.indexOf('#EXTM3U')!==0||film.classList.contains('started'))return;
   var MS=window.ManagedMediaSource||window.MediaSource,H264=MS&&MS.isTypeSupported&&MS.isTypeSupported('video/mp4; codecs="avc1.640028,mp4a.40.2"');
   if(window.Hls&&Hls.isSupported()&&H264)useHls();else if(video.canPlayType('application/vnd.apple.mpegurl'))useNative()}).catch(function(){})}
 video.addEventListener('play',function(){load(video.currentTime||null)});
 function start(at){
  if(load(at))at=null;
  if(at!=null){try{video.currentTime=at}catch(e){}}
  video.controls=true;film.classList.add('started');if(d.activeElement===play)video.focus({preventScroll:true});
  var p=video.play();if(p&&p.catch)p.catch(function(){});
 }
 play.addEventListener('click',function(){start()});
 video.addEventListener('play',function(){film.classList.add('playing','started');video.controls=true;loopAmbient()});
 video.addEventListener('pause',function(){film.classList.remove('playing')});
 video.addEventListener('ended',function(){film.classList.remove('playing')});
 /* the film's own light spills onto the page while it plays (a few times a second, only on screen) */
 /* repainted on every frame the video presents (requestVideoFrameCallback), so the light follows each cut
    within a frame; where that call is missing, on animation frames whenever the picture's time has moved */
 var ambOn=false,ambLast=-1,VFC='requestVideoFrameCallback' in video;
 function ambNext(){if(VFC)video.requestVideoFrameCallback(ambFrame);else requestAnimationFrame(ambFrame)}
 function loopAmbient(){if(ambOn)return;ambOn=true;ambNext()}
 function ambFrame(){if(!filmOn||d.hidden){ambOn=false;return}
  if(video.readyState>1&&video.currentTime!==ambLast){ambLast=video.currentTime;paintAmbient(video)}
  if(video.paused||video.ended){ambOn=false;return}ambNext()}
 video.addEventListener('seeked',function(){if(video.readyState>1&&film.classList.contains('started'))paintAmbient(video)});
 new IntersectionObserver(function(es){es.forEach(function(e){filmOn=e.isIntersecting;if(filmOn)loopAmbient()})},{threshold:0}).observe(film);
 /* every Watch link plays from the top (or resumes) and brings the screen into view */
 $$('[data-watch]').forEach(function(a){a.addEventListener('click',function(ev){ev.preventDefault();film.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});start(video.ended?0:null);video.focus({preventScroll:true})})});
 /* the viewer: the whole film section goes fullscreen (or, where an element cannot, an edge-to-edge layer) */
 var vbtn=$('#viewerBtn');
 function fsEl(){return d.fullscreenElement||d.webkitFullscreenElement}
 var behind=$$('body>*:not(main):not(script):not(svg),main>*:not(#film)');
 function setViewer(on){film.classList.toggle('viewer',on);root.classList.toggle('viewing',on);vbtn.setAttribute('aria-pressed',on);behind.forEach(function(el){el.inert=on});paintAmbient(video.readyState>1&&film.classList.contains('started')?video:poster)}
 function openViewer(){setViewer(true);var rq=film.requestFullscreen||film.webkitRequestFullscreen;if(rq){try{var p=rq.call(film);if(p&&p.catch)p.catch(function(){})}catch(e){}}if(!film.classList.contains('started'))start()}
 function closeViewer(){if(fsEl()){var ex=d.exitFullscreen||d.webkitExitFullscreen;try{ex.call(d)}catch(e){}}setViewer(false)}
 if(vbtn){vbtn.addEventListener('click',function(){film.classList.contains('viewer')?closeViewer():openViewer()});
  video.addEventListener('dblclick',function(){film.classList.contains('viewer')?closeViewer():openViewer()});
  /* a browser's own fullscreen on the bare video (where the hide hint is ignored) becomes the viewer instead */
  ['fullscreenchange','webkitfullscreenchange'].forEach(function(ev){d.addEventListener(ev,function(){var f=fsEl();
   if(f===video){film.dataset.keep='1';var ex=d.exitFullscreen||d.webkitExitFullscreen;try{var p=ex.call(d);if(p&&p.catch)p.catch(function(){})}catch(e){}setViewer(true);return}
   if(!f&&film.classList.contains('viewer')&&!film.dataset.keep)setViewer(false);delete film.dataset.keep})});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'&&film.classList.contains('viewer')&&!fsEl())setViewer(false)})}
 window.novaPlayFrom=function(t){film.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});start(t);video.focus({preventScroll:true})};
}

/* ---------------- sharing ---------------- */
/* A web page cannot post to an Instagram story: only the app can. So Share to Instagram opens three steps
   beside the story card: save it (on a phone, the share sheet's Save Image puts it in Photos; on Android,
   Instagram Stories is right there in the sheet), open the story camera (instagram://story-camera on iPhone,
   an intent on Android; inside Instagram's own browser, close the page and tap +), and copy the address for
   the link sticker. The card is fetched ahead as the buttons come near, so the share stays inside the tap.
   Without the script the button simply downloads the card. X is a plain link to a prefilled post. */
var shIg=$('#shareIg'),shMsg=$('#shareMsg'),igs=$('#igs'),cardFile=null,cardP=null,UA=navigator.userAgent,
 IN_IG=/Instagram/i.test(UA),IOS=/iP(hone|ad|od)/.test(UA)||(/Macintosh/.test(UA)&&navigator.maxTouchPoints>1),ANDROID=/Android/i.test(UA),SITE='https://nova.tehbyn.com/';
function say(t){if(!shMsg)return;shMsg.textContent=t;clearTimeout(say.t);say.t=setTimeout(function(){shMsg.textContent=''},8000)}
function getCard(){if(!cardP&&window.fetch&&window.File)cardP=fetch(shIg.getAttribute('href')).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){cardFile=new File([b],'nova-ep1-david-goliath-story.jpg',{type:'image/jpeg'});return cardFile}).catch(function(){cardP=null});return cardP}
function copyLink(){try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(SITE).then(function(){return true},function(){return false})}catch(e){}return Promise.resolve(false)}
function saveFile(){var a=d.createElement('a');a.href=shIg.getAttribute('href');a.download=shIg.getAttribute('download');d.body.appendChild(a);a.click();a.remove()}
function canShareCard(){return !!(cardFile&&navigator.canShare&&navigator.share&&navigator.canShare({files:[cardFile]}))}
if(shIg){
 if('IntersectionObserver' in window)new IntersectionObserver(function(es,o){if(es[0].isIntersecting){o.disconnect();getCard()}},{rootMargin:'400px 0px'}).observe(shIg);
 if(igs&&igs.showModal){
  var stp=function(n){return $('#igs'+n)},open=$('#igsOpen'),saveTip=$('#igsSaveTip'),openTip=$('#igsOpenTip');
  /* the steps, worded for where the visitor is */
  if(IN_IG){open.hidden=true;openTip.textContent='Close this page, tap + and choose Story, then pick the card from your photos.'}
  else if(IOS){open.href='instagram://story-camera';open.removeAttribute('target');openTip.textContent='Then pick the card from your photos.'}
  else if(ANDROID){open.href='intent://story-camera#Intent;scheme=instagram;package=com.instagram.android;S.browser_fallback_url='+encodeURIComponent('https://www.instagram.com/')+';end';open.removeAttribute('target');openTip.textContent='Then pick the card from your gallery.'}
  else{openTip.textContent='Stories are posted from the Instagram app, so send the card to your phone first.'}
  saveTip.textContent=IOS?'Choose Save Image in the sheet that opens.':ANDROID?'Choose Instagram Stories to post it straight away, or save it.':'It saves to your downloads.';
  shIg.addEventListener('click',function(e){e.preventDefault();getCard();igs.showModal();root.classList.add('lb-open')});
  igs.addEventListener('close',function(){root.classList.remove('lb-open')});
  $('[data-close]',igs).addEventListener('click',function(){igs.close()});
  igs.addEventListener('click',function(e){if(e.target===igs)igs.close()});
  $('#igsSave').addEventListener('click',function(){
   if(canShareCard()){navigator.share({files:[cardFile]}).then(function(){stp(1).classList.add('done')},function(err){if(err&&err.name!=='AbortError'){saveFile();stp(1).classList.add('done')}});return}
   saveFile();stp(1).classList.add('done')});
  open.addEventListener('click',function(){stp(2).classList.add('done')});
  $('#igsCopy').addEventListener('click',function(){var b=this;copyLink().then(function(ok){b.textContent=ok?'Copied':'nova.tehbyn.com';if(ok)stp(3).classList.add('done');setTimeout(function(){b.textContent='Copy link'},2500)})});
 }else{
  /* no <dialog>: the download goes ahead (the link's default) and the address is copied */
  shIg.addEventListener('click',function(){copyLink().then(function(ok){say('Story card saved'+(ok?' and link copied':'')+'. Post it to your Instagram story with a link sticker.')})})}}

/* ---------------- stills lightbox ---------------- */
var lb=$('#lb'),stills=$$('.still'),cur=0;
var S=stills.map(function(b){var img=$('img',b),cap=$('.cap',b);return{src:img.getAttribute('src').replace('-t.jpg','.jpg'),alt:img.alt,name:cap.firstChild.textContent,tc:$('em',cap).textContent}});
function secs(tc){var p=tc.split(':');return +p[0]*60+ +p[1]+.5}
function show(i){cur=(i+S.length)%S.length;var s=S[cur];var im=$('#lbImg');im.src=s.src;im.alt=s.alt;$('#lbName').textContent=s.name;$('#lbTc').textContent=s.tc;$('#lbPlayTxt').textContent='Play from '+s.tc;
 var n=S[(cur+1)%S.length];(new Image()).src=n.src}
if(lb&&lb.showModal){
 stills.forEach(function(b,i){b.addEventListener('click',function(){show(i);lb.showModal();root.classList.add('lb-open')})});
 lb.addEventListener('close',function(){root.classList.remove('lb-open')});
 $$('[data-step]',lb).forEach(function(b){b.addEventListener('click',function(){show(cur+ +b.dataset.step)})});
 $('[data-close]',lb).addEventListener('click',function(){lb.close()});
 lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-fig'))lb.close()});
 lb.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){show(cur+1);e.preventDefault()}else if(e.key==='ArrowLeft'){show(cur-1);e.preventDefault()}});
 $('#lbPlay').addEventListener('click',function(){var t=secs(S[cur].tc);lb.close();if(window.novaPlayFrom)window.novaPlayFrom(t)});
}

/* ---------------- wallpaper preview: the full picture in a phone, the viewer's own time over it ---------------- */
/* opens from the card's picture or its Preview link (both plain links to the full JPEG without the script);
   the thumbnail shows at once and the full 2160 x 4680 picture replaces it when it has loaded */
var wp=$('#wp'),wcards=$$('.dl'),wcur=0;
var WP=wcards.map(function(f){var im=$('.ph img',f),dl=$('a[download]',f);return{thumb:im.getAttribute('src'),full:dl.getAttribute('href'),file:dl.getAttribute('download'),alt:im.alt,name:$('.cap',f).firstChild.textContent,meta:$('.cap em',f).textContent}});
function clock(){var n=new Date();try{$('#wpTime').textContent=n.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}).replace(/\s?[AP]M$/i,'');$('#wpDate').textContent=n.toLocaleDateString([],{weekday:'long',day:'numeric',month:'long'})}catch(e){}}
function wshow(i){wcur=(i+WP.length)%WP.length;var w=WP[wcur],im=$('#wpImg');im.src=w.thumb;im.alt=w.alt;
 var full=new Image();full.onload=function(){if(WP[wcur]===w)im.src=w.full};full.src=w.full;
 $('#wpName').textContent=w.name;$('#wpMeta').textContent=w.meta;var g=$('#wpGet');g.href=w.full;g.download=w.file;clock()}
if(wp&&wp.showModal&&WP.length){
 $$('[data-wp]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();wshow(+a.dataset.wp);wp.showModal();root.classList.add('lb-open')})});
 wp.addEventListener('close',function(){root.classList.remove('lb-open')});
 $$('[data-step]',wp).forEach(function(b){b.addEventListener('click',function(){wshow(wcur+ +b.dataset.step)})});
 $('[data-close]',wp).addEventListener('click',function(){wp.close()});
 wp.addEventListener('click',function(e){if(e.target===wp||e.target.classList.contains('wp-fig'))wp.close()});
 wp.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){wshow(wcur+1);e.preventDefault()}else if(e.key==='ArrowLeft'){wshow(wcur-1);e.preventDefault()}});
 /* a swipe across the phone steps through the five */
 var sx=null,ph=$('#wpPhone');ph.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
 ph.addEventListener('touchend',function(e){if(sx==null)return;var dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>40)wshow(wcur+(dx<0?1:-1))});
 $('#wpClock').addEventListener('click',function(){var on=ph.classList.toggle('bare');this.setAttribute('aria-pressed',!on)})}

/* ---------------- story: the study on the stage follows the paragraph you are reading ---------------- */
/* one visible image; the next study fades in on a layer that leaves the page again once it has landed */
var stage=$('#stage'),beats=$$('.beat'),base=stage&&$('.st-base',stage),fade=stage&&$('.st-fade',stage),shown=base&&base.getAttribute('src'),fadeT;
if(stage){var pre=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;pre.disconnect();if(getComputedStyle(stage).display==='none')return;
 beats.forEach(function(b){if(b.dataset.study){var im=new Image();im.decoding='async';im.src=b.dataset.study}})},{rootMargin:'100% 0px'});pre.observe(stage.parentElement||stage)}
function study(src){if(!base||src===shown)return;shown=src;clearTimeout(fadeT);
 if(RM){base.src=src;return}
 fade.classList.remove('go');fade.style.opacity=0;fade.src=src;fade.classList.add('go');void fade.offsetWidth;fade.style.opacity=1;
 fadeT=setTimeout(function(){base.src=src;fade.classList.remove('go')},850)}
if(beats.length){var bo=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var i=beats.indexOf(e.target);
  beats.forEach(function(b,k){b.classList.toggle('on',k===i)});study(e.target.dataset.study)})},{rootMargin:'-45% 0px -45% 0px'});
 beats.forEach(function(b){bo.observe(b)})}

/* ---------------- craft stories: play on arrival, reset on leave, so they replay on return ---------------- */
var tiles=$('#tiles'),frames=$('#frames'),turn=$('#turn'),deg=$('#deg'),degtc=$('#degtc');
var TURN=[[90,'0:21'],[81,'0:33'],[73,'0:45'],[67,'0:54'],[62,'1:02'],[47,'1:23'],[43,'1:30'],[41,'1:32'],[39,'1:35'],[35,'1:42'],[30,'1:48'],[0,'2:37']];
var ORDER=[3,11,0,7,14,5,9,1,16,12,4,8,15,2,10,6,13];  /* the order 17 render pieces might finish in, side by side */
if(tiles){for(var k=0;k<17;k++){var t=d.createElement('i');t.className='tile';t.style.backgroundPosition=(k/16*100)+'% 0';tiles.appendChild(t)}}
var timers={};
function later(key,fn,ms){(timers[key]=timers[key]||[]).push(setTimeout(fn,ms))}
function clear(key){(timers[key]||[]).forEach(clearTimeout);timers[key]=[]}
function setTurn(i){if(!turn)return;turn.style.backgroundPosition=(-224*i)+'px 0';deg.textContent=TURN[i][0]+'°';degtc.textContent=TURN[i][1]}
var STORY={
 pieces:{play:function(){var ts=$$('.tile',tiles);if(RM){ts.forEach(function(t){t.classList.add('on')});frames.textContent='4,025';return}
   frames.textContent='0';ORDER.forEach(function(n,j){later('pieces',function(){ts[n].classList.add('on','hot');later('pieces',function(){ts[n].classList.remove('hot')},420)},120+j*95)});
   tween(120+17*95,function(k){frames.textContent=Math.round(4025*ease(k,2)).toLocaleString('en-US')})},
  reset:function(){clear('pieces');$$('.tile',tiles).forEach(function(t){t.classList.remove('on','hot')})}},
 turn:{play:function(){if(RM){setTurn(11);return}setTurn(0);for(var i=1;i<12;i++)(function(i){later('turn',function(){setTurn(i)},400+i*(i===11?300:210))})(i)},
  reset:function(){clear('turn');setTurn(0)}},
 score:{play:function(){},reset:function(){}},
 sign:{play:function(){},reset:function(){}}
};
setTurn(RM?11:0);
var so=new IntersectionObserver(function(es){es.forEach(function(e){var s=STORY[e.target.dataset.story];if(!s)return;
 if(e.isIntersecting){e.target.classList.add('live');later('k'+e.target.dataset.story,function(){s.play()},250)}
 else{clear('k'+e.target.dataset.story);s.reset();e.target.classList.remove('live')}})},{threshold:.45});
$$('[data-story]').forEach(function(c){so.observe(c)});

/* the new star's glint sits on the star wherever background-size:cover puts it (wide or tall plate) */
var glint=$('#glint'),plate=glint&&glint.parentElement;
var PLATES={wide:{w:2400,h:1350,px:.62,py:1,sx:.60,sy:.24},tall:{w:1080,h:1920,px:.5,py:1,sx:.30,sy:.73}};
function placeGlint(){if(!glint)return;var P=matchMedia('(max-aspect-ratio: 4/5)').matches?PLATES.tall:PLATES.wide,W=plate.offsetWidth,H=plate.offsetHeight,k=Math.max(W/P.w,H/P.h);
 glint.style.setProperty('--gx',((W-P.w*k)*P.px+P.sx*P.w*k).toFixed(1)+'px');glint.style.setProperty('--gy',((H-P.h*k)*P.py+P.sy*P.h*k).toFixed(1)+'px')}
placeGlint();addEventListener('resize',placeGlint);
if(glint)new IntersectionObserver(function(es){es.forEach(function(e){glint.classList.toggle('off',!e.isIntersecting)})}).observe(plate);

/* pointer depth in the hero */
var hero=$('#top');
if(hero&&!RM&&matchMedia('(pointer:fine)').matches){hero.addEventListener('pointermove',function(e){var b=hero.getBoundingClientRect();hero.style.setProperty('--mx',((e.clientX-b.left)/b.width-.5).toFixed(3));hero.style.setProperty('--my',((e.clientY-b.top)/b.height-.5).toFixed(3))});hero.addEventListener('pointerleave',function(){hero.style.setProperty('--mx',0);hero.style.setProperty('--my',0)})}

/* scroll-linked: hero parallax, band and footer plates climb as they arrive */
var band=$('#band'),foot=$('#foot'),pending=false;
function arrive(el){var r=el.getBoundingClientRect();return Math.max(0,Math.min(1,(VH-r.top)/(VH*.9)))}
function tick(){pending=false;if(RM)return;
 if(hero){var rc=hero.getBoundingClientRect();hero.style.setProperty('--p',Math.max(0,Math.min(1,-rc.top/rc.height)).toFixed(3))}
 if(band)band.style.setProperty('--bp',arrive(band).toFixed(3));if(foot)foot.style.setProperty('--bp',arrive(foot).toFixed(3))}
addEventListener('scroll',function(){if(!pending){pending=true;requestAnimationFrame(tick)}},{passive:true});addEventListener('resize',tick);tick();

/* a hidden tab stops the ambient light */
d.addEventListener('visibilitychange',function(){if(!d.hidden&&video&&!video.paused)loopAmbient()});
})();
