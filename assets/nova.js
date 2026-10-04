/* Nova, Episode 1: page behaviour. Spliced from cmo-design's landing.js (word masks, reveals, one-shot
   stories, scroll-linked values, pointer depth, loops that pause off screen) plus the film's own parts:
   the player with its ambient light, the stills lightbox, the story stage and the four craft stories.
   Every block is guarded, so the page reads fully without JavaScript. */
(function(){
var d=document,root=d.documentElement;root.classList.add('js');
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
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
$$('[data-r],[data-split]:not(#h1)').forEach(function(el){var p=el.parentElement,grid=p&&(p.classList.contains('stills')||p.classList.contains('cards')),sib=grid?[].indexOf.call(p.children,el):0;
 el.style.transitionDelay=(grid?Math.min((sib%4)*90,270):0)+'ms';io.observe(el)});

/* ---------------- the film ---------------- */
var film=$('#film'),video=$('#video'),play=$('#play'),amb=$('#ambient'),actx=amb&&amb.getContext('2d'),ambT=0,filmOn=false;
function paintAmbient(src){if(!actx)return;try{actx.drawImage(src,0,0,amb.width,amb.height)}catch(e){}}
if(video){
 var poster=new Image();poster.onload=function(){paintAmbient(poster)};poster.src=video.getAttribute('poster');
 function start(at){
  if(at!=null){try{video.currentTime=at}catch(e){}}
  video.controls=true;film.classList.add('started');
  var p=video.play();if(p&&p.catch)p.catch(function(){});
 }
 play.addEventListener('click',function(){start()});
 video.addEventListener('play',function(){film.classList.add('playing','started');video.controls=true;loopAmbient()});
 video.addEventListener('pause',function(){film.classList.remove('playing')});
 video.addEventListener('ended',function(){film.classList.remove('playing')});
 /* the film's own light spills onto the page while it plays (a few times a second, only on screen) */
 function loopAmbient(){if(video.paused||video.ended||!filmOn)return;var n=performance.now();if(n-ambT>180){ambT=n;paintAmbient(video)}requestAnimationFrame(loopAmbient)}
 new IntersectionObserver(function(es){es.forEach(function(e){filmOn=e.isIntersecting;if(filmOn)loopAmbient()})},{threshold:0}).observe(film);
 /* every Watch link plays from the top (or resumes) and brings the screen into view */
 $$('[data-watch]').forEach(function(a){a.addEventListener('click',function(ev){ev.preventDefault();film.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});start(video.ended?0:null)})});
 window.novaPlayFrom=function(t){film.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});start(t)};
}

/* ---------------- stills lightbox ---------------- */
var lb=$('#lb'),stills=$$('.still'),cur=0;
var S=stills.map(function(b){var img=$('img',b),cap=$('.cap',b);return{src:img.getAttribute('src').replace('-t.jpg','.jpg'),alt:img.alt,name:cap.firstChild.textContent,tc:$('em',cap).textContent}});
function secs(tc){var p=tc.split(':');return +p[0]*60+ +p[1]+.5}
function show(i){cur=(i+S.length)%S.length;var s=S[cur];var im=$('#lbImg');im.src=s.src;im.alt=s.alt;$('#lbName').textContent=s.name;$('#lbTc').textContent=s.tc;$('#lbPlayTxt').textContent='Play from '+s.tc;
 var n=S[(cur+1)%S.length];(new Image()).src=n.src}
if(lb&&lb.showModal){
 stills.forEach(function(b,i){b.addEventListener('click',function(){show(i);lb.showModal()})});
 $$('[data-step]',lb).forEach(function(b){b.addEventListener('click',function(){show(cur+ +b.dataset.step)})});
 $('[data-close]',lb).addEventListener('click',function(){lb.close()});
 lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-fig'))lb.close()});
 lb.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){show(cur+1);e.preventDefault()}else if(e.key==='ArrowLeft'){show(cur-1);e.preventDefault()}});
 $('#lbPlay').addEventListener('click',function(){var t=secs(S[cur].tc);lb.close();if(window.novaPlayFrom)window.novaPlayFrom(t)});
}

/* ---------------- story: the study on the stage follows the paragraph you are reading ---------------- */
/* one visible image; the next study fades in on a layer that leaves the page again once it has landed */
var stage=$('#stage'),beats=$$('.beat'),base=stage&&$('.st-base',stage),fade=stage&&$('.st-fade',stage),shown=base&&base.getAttribute('src'),fadeT;
beats.forEach(function(b){var im=new Image();im.decoding='async';if(b.dataset.study&&stage&&getComputedStyle(stage).display!=='none')im.src=b.dataset.study});
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
function arrive(el){var r=el.getBoundingClientRect();return Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight*.9)))}
function tick(){pending=false;if(RM)return;
 if(hero){var rc=hero.getBoundingClientRect();hero.style.setProperty('--p',Math.max(0,Math.min(1,-rc.top/rc.height)).toFixed(3))}
 if(band)band.style.setProperty('--bp',arrive(band).toFixed(3));if(foot)foot.style.setProperty('--bp',arrive(foot).toFixed(3))}
addEventListener('scroll',function(){if(!pending){pending=true;requestAnimationFrame(tick)}},{passive:true});addEventListener('resize',tick);tick();

/* a hidden tab stops the ambient light */
d.addEventListener('visibilitychange',function(){if(!d.hidden&&video&&!video.paused)loopAmbient()});
})();
