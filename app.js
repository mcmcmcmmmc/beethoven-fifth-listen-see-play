'use strict';
(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const Q = 0.3125; // MIDI tempo: quarter = 192; one 2/4 bar = 0.625 seconds.
const names = ['长笛','双簧管','单簧管','巴松','圆号','小号','定音鼓','第一小提琴','第二小提琴','中提琴','大提琴','低音提琴'];
const families = ['wood','wood','wood','wood','brass','brass','percussion','strings','strings','strings','strings','strings'];
const familyLabels = {strings:'弦乐',wood:'木管',brass:'铜管',percussion:'定音鼓'};
const colors = {strings:'#687d46',wood:'#658da7',brass:'#d8794e',percussion:'#a586ac'};
const enabled = new Set(Object.keys(familyLabels));
const endBeat = 1262;
const notes = [];
SCORE.tracks.forEach((t, track) => t.notes.forEach(([b,d,p,v]) => {
  const n = {b:b < 248 ? b : b+248,d,p,v:v/127,track,f:families[track]};
  notes.push(n);
  if(b < 248) notes.push({...n,b:b+248});
}));
notes.sort((a,b)=>a.b-b.b);
function barBeat(bar, repeat=false){return (bar-1)*2+(bar>=269?10:0)+(bar>=125||repeat?248:0);}
function position(b){const repeat=b>=248&&b<496; const raw=b>=248?b-248:b;return {bar:raw>=534&&raw<546?268:Math.min(502,Math.floor((raw-(raw>=546?10:0))/2)+1),repeat,raw};}
const sections = [
 {start:0,end:116,title:'提出核心材料',term:'Exposition · 呈示部 / 核心',n:'①',bar:1},
 {start:116,end:248,title:'走进对比的新区域',term:'Exposition · 呈示部 / 对比',n:'②',bar:59},
 {start:248,end:364,title:'再认一次核心',term:'Exposition repeat · 呈示部反复',n:'↺ ①',bar:1},
 {start:364,end:496,title:'再认一次对比',term:'Exposition repeat · 呈示部反复',n:'↺ ②',bar:59},
 {start:496,end:742,title:'拆解、组合、转移',term:'Development · 展开部',n:'③',bar:125},
 {start:742,end:1004,title:'原来的材料回来了',term:'Recapitulation · 再现部',n:'④',bar:248},
 {start:1004,end:1262,title:'还没结束，继续推进',term:'Coda · 尾声',n:'⑤',bar:374}
];
// Interpretive teaching regions, grounded in the bundled LilyPond score and Wieland's diagram.
const lessons = [
 {bar:1,title:'一个短材料，先敲两次门。',desc:'听到三下短促的敲击，然后一个往下落的长音。第二次敲门整体降低，而且长音停留得更久。先记住它的节奏轮廓。',src:1,op:'同一节奏，第二次换了音高',flow:['A','换音高','A'],explain:'种子 A 先亮相；重复让它留在你的记忆里。'},
 {bar:6,title:'它变轻了，也开始在声部间传递。',desc:'开头的停顿让位给连续的接力。留意不同高低位置上的短音群：音乐开始流动，短短短长的线索还在。原谱这里转弱；本 MIDI 不保留这一力度变化。',src:1,op:'换音区、接力、放进连续的句子',flow:['A','接力','A','接力','A'],explain:'多个声部轮流进入，像同一句话由不同的人接着讲。'},
 {bar:22,title:'小材料开始推着音乐向前走。',desc:'听音符如何不断重复、往新的音高移，再加密成奔跑的线条。连接两个区域的路，本身也是用熟悉的材料铺出来的。',src:1,op:'重复、移位、加密',flow:['A','移位 + 推进','C'],explain:'C 不是一块凭空出现的新旋律，而是“把音乐推向别处”的段落角色。'},
 {bar:59,title:'一个号角式呼唤，打开新的区域。',desc:'先听圆号的呼唤。短音与长音的关系让人想到开头，接下来却出现了更舒展的歌唱。新区域不是突然与过去断开。',src:1,op:'换声部、换轮廓，成为引子',flow:['A','变成呼唤','B'],explain:'A 的亲缘线索成为门口的招呼，然后 B 进入。'},
 {bar:63,title:'上面在歌唱，下面仍在敲。',desc:'弦乐旋律变得连贯、舒展。把注意力往低处移：三短一长的节奏关系仍在伴奏里活动。对比与联系可以同时存在。',src:1,op:'舒展的新旋律，叠上熟悉的节奏',flow:['B','叠在上面','D'],explain:'B 与从 A 提取的节奏 D 并存；新角色登场，旧线索仍在场。'},
 {bar:95,title:'熟悉的短音，帮助这一大段收束。',desc:'音乐聚拢、加强结束感，却仍能听到短音群的回响。第一次到这里，接着会返回开头；第二次才进入拆解区域。',src:1,op:'回收节奏线索，形成收束',flow:['A','回收 + 收束','D'],explain:'这些积木在结尾再次出现，帮耳朵记住这一段的身份。'},
 {bar:125,title:'种子回来了，周围却陌生起来。',desc:'你仍可能认出那种敲击，但它落入新的音高环境。留意“我认得这个形状”和“我不知道它要去哪”同时发生。',src:1,op:'熟悉材料进入新的音高环境',flow:['A','转移','A'],explain:'把熟悉的材料带到不稳定的新位置，是这一大区间的起点。'},
 {bar:153,title:'像爬楼梯一样，一段接一段转移。',desc:'短音群被一遍遍带到新的位置。这里不用急着给每个和弦命名，先听连续转移带来的“不落地”的感觉。',src:6,op:'换音高、重复推进',flow:['A','移位','A','移位','A'],explain:'保留局部轮廓，改变放置位置：相同与不同一起推动音乐。'},
 {bar:179,title:'先前的呼唤，被拉长、重新分配。',desc:'把这里和第 59 小节的呼唤放在一起想。材料不只会被照搬，也能被拉伸、拆开，交给不同声部应答。',src:59,op:'拉长与分配，保留亲缘线索',flow:['A','拉长 / 应答','C'],explain:'这里回望此前的号角式材料；不是简单把整个新区域再演一遍。'},
 {bar:196,title:'句子越来越短，像隔空应答。',desc:'有些地方不再给你完整的四音形状，而只剩很小的片段、长音与声部之间的交替。听空隙：删去的部分也能制造期待。',src:179,op:'拆小、留下空隙、轮流回应',flow:['A','拆小','D','应答','D'],explain:'这里的 D 是节奏层面的教学抽象，不表示所有长音都是四音动机。'},
 {bar:228,title:'散开的材料，重新聚到一起。',desc:'反复的短音把压力积累起来。你还没看到地图，也许已经感觉到有一个重要东西快要回来。',src:1,op:'聚集、重复，准备回归',flow:['D','累积','A'],explain:'从碎片到聚集，让回归不只是日历上的一个时间点。'},
 {bar:248,title:'那个开头回来了，但已经不是初见。',desc:'熟悉的敲击重新出现。经历过中间的拆解，耳朵会把同样的形状听成“回来”。这里的声部配置也与第一次并不完全相同。',src:1,op:'回归与重新配器',flow:['A','经历旅程后','A'],explain:'材料的意义，取决于它在什么时候回来。'},
 {bar:268,title:'突然，像只剩一个人在说话。',desc:'双簧管独自唱出一小段自由的句子。先前机械般的推进被打断。真实演奏会在这里自由呼吸；当前合成导听仅呈现写出的音高与机械时值。',src:248,op:'中断集体推进，留出独奏空间',flow:['A','暂停','独奏'],explain:'这段独白是一次意外的停顿，不是第二主题 B。积木地图也需要留出无法硬套进四个标签的空间。'},
 {bar:269,title:'短音群接过话，音乐重新向前。',desc:'独奏留下的空隙结束了。熟悉的连接材料重新把音乐推向下一处歌唱区域。试着与第 22 小节相比。',src:22,op:'取回推进材料，调整路径',flow:['A','重新推进','C'],explain:'同一种“连接”工作，可以在音乐的不同阶段再次承担。'},
 {bar:303,title:'舒展的区域也回来了，颜色变了。',desc:'这段歌唱与前面的第二片区域有亲缘关系，但现在落在另一组音高关系中，听起来更明亮。先听出熟悉的走向，再体会背景的变化。',src:59,op:'熟悉旋律回来，换音高环境',flow:['B','回来 + 换背景','D'],explain:'专业分析称这里进入 C 大调；先认出旋律，术语才有可以指向的声音。'},
 {bar:374,title:'明明可以结束，他却继续追问。',desc:'音乐没有在预期处停下来，又一次把冲突推开。尾声不是几下结束符号：这里几乎又是一个主要章节。',src:125,op:'延迟结束，再次展开冲突',flow:['A','继续拆解','C'],explain:'作品的力量也来自时间安排：什么时候还不让你离开。'},
 {bar:424,title:'最后的大段路，还在继续延伸。',desc:'注意新的轮廓、反复与累积怎样延长这次收束。不要强迫每一个音都等同开头；关联是一条线索，不是唯一答案。',src:374,op:'延伸、累积，重新组织结尾',flow:['C','延伸 + 累积','D'],explain:'少量材料帮助理解整体，但乐章并不只有一个四音密码。'},
 {bar:478,title:'最后再认出它，这次真的要结束了。',desc:'开头的种子在终点前再次显露。接下来的强烈收束让它从一个问题，变成经历整场旅程之后的回答。',src:1,op:'最终回收，与结束动作结合',flow:['A','最终回收','A'],explain:'把开头与此刻相连：同一个材料，因为整段经历而有了不同重量。'}
];
function lessonAt(b){const p=position(b); return lessons.findLast(x=>x.bar<=p.bar);}
function sectionAt(b){return sections.find(s=>b>=s.start&&b<s.end)||sections.at(-1);}
const motifMatches=[];
SCORE.tracks.forEach((t,track)=>{
  const mono=t.notes.filter((n,i,a)=>!i||n[0]!==a[i-1][0]);
  for(let i=0;i<mono.length-3;i++){
    const a=mono.slice(i,i+4);
    if(a.slice(0,3).every(n=>n[2]===a[0][2]&&Math.abs(n[1]-.5)<.02)&&a[3][1]>=1&&a.slice(1).every((n,j)=>Math.abs(n[0]-a[j][0]-.5)<.02)){
      const item={b:a[0][0]<248?a[0][0]:a[0][0]+248,end:(a[0][0]<248?a[0][0]:a[0][0]+248)+1.5+a[3][1],track};
      motifMatches.push(item); if(a[0][0]<248)motifMatches.push({...item,b:item.b+248,end:item.end+248});
    }
  }
});

let ctx,master,compressor,analyser; const voices=new Set();
function createAudioGraph(){
  if(ctx)return;
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor)throw new Error('当前浏览器不支持 Web Audio');
  ctx=new AudioCtor();master=ctx.createGain();master.gain.value=Number($('#volume').value)/100*.42;compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-17;compressor.knee.value=18;compressor.ratio.value=6;analyser=ctx.createAnalyser();analyser.fftSize=2048;master.connect(compressor);compressor.connect(analyser);analyser.connect(ctx.destination);
}
// iOS WebKit can report a resumed AudioContext while dropping the first real
// oscillator if no source was started during the user gesture. Start a silent
// one synchronously before awaiting resume(), then schedule musical voices.
function primeAudio(){
  createAudioGraph();
  if(ctx.state==='running')return;
  const buffer=ctx.createBuffer(1,1,ctx.sampleRate);
  const source=ctx.createBufferSource(),gain=ctx.createGain();
  gain.gain.value=0;source.buffer=buffer;source.connect(gain);gain.connect(master);source.start(0);
  const pending=ctx.resume();if(pending?.catch)pending.catch(()=>{});
}
async function audioReady(){
  try{
    createAudioGraph();
    primeAudio();
    if(ctx.state!=='running')await ctx.resume();
    if(ctx.state!=='running')throw new Error('浏览器未开启音频');
    $('#audio-error').hidden=true;return true;
  }catch(e){$('#audio-error').hidden=false;$('#audio-error').textContent='声音暂时无法启动：'+e.message+'。请点击播放重试，并检查浏览器的声音权限。';return false;}
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&ctx&&ctx.state!=='running')ctx.resume().catch(()=>{});
});
const waves={};
function wave(f){
  if(waves[f])return waves[f];
  if(!ctx.createPeriodicWave)return null;
  const partials={strings:[0,1,.36,.2,.13,.075,.045],wood:[0,1,.12,.28,.025,.08],brass:[0,1,.5,.3,.16,.1],percussion:[0,1,.3,.12],piano:[0,1,.32,.18,.09,.05]};
  const x=partials[f]||partials.piano;return waves[f]=ctx.createPeriodicWave(new Float32Array(x.length),new Float32Array(x));
}
function sound(p,d,at,f='piano',volume=.5,pan=0,owner='demo'){
  if(!ctx||d<=0)return;
  const osc=ctx.createOscillator(),gain=ctx.createGain(),stereo=ctx.createStereoPanner?.();
  const shape=wave(f);if(shape)osc.setPeriodicWave(shape);else osc.type='sine';osc.frequency.value=440*2**((p-69)/12);if(stereo)stereo.pan.value=pan;
  const duration=Math.max(.035,d*.94),attack=Math.min(.018,duration*.12),level=volume*.18;
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+attack);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level*(f==='piano'||f==='percussion'?.24:.72)),at+duration);
  gain.gain.exponentialRampToValueAtTime(.0001,at+duration+.045);
  osc.connect(gain);if(stereo){gain.connect(stereo);stereo.connect(master);}else gain.connect(master);osc.start(at);osc.stop(at+duration+.05);
  const v={osc,gain,stereo,owner};voices.add(v);osc.onended=()=>{voices.delete(v);osc.disconnect();gain.disconnect();stereo?.disconnect();};
}
function silence(owner){for(const v of voices){if(owner&&v.owner!==owner)continue;try{v.gain.gain.cancelScheduledValues(ctx.currentTime);v.gain.gain.setTargetAtTime(.0001,ctx.currentTime,.004);v.osc.stop(ctx.currentTime+.025);}catch{}}}
let playing=false,beat=0,baseBeat=0,baseTime=0,index=0,speed=1,loopBounds=null;
function clockBeat(){return playing?baseBeat+(ctx.currentTime-baseTime)/Q*speed:beat;}
function lowerBound(b){let lo=0,hi=notes.length;while(lo<hi){const m=(lo+hi)>>1;if(notes[m].b<b)lo=m+1;else hi=m;}return lo;}
function resumeAt(b){beat=Math.max(0,Math.min(endBeat,b));baseBeat=beat;baseTime=ctx.currentTime+.025;index=lowerBound(beat);playing=true;lastCue='';
  // Resume notes that straddle a seek or pause boundary.
  for(let i=Math.max(0,index-500);i<index;i++){const n=notes[i];if(n.b+n.d>beat&&enabled.has(n.f))sound(n.p,(n.b+n.d-beat)*Q/speed,baseTime,n.f,n.v,panFor(n.track),'score');}
  updatePlayButton();
}
function panFor(t){return [-.25,.2,-.1,.3,-.35,.35,0,-.45,.25,-.1,.2,.35][t];}
function pause(){if(playing)beat=Math.max(0,Math.min(endBeat,clockBeat()));playing=false;silence('score');updatePlayButton();}
async function play(){cancelDemo();if(!await audioReady())return;if(beat>=endBeat)beat=0;resumeAt(beat);}
async function seek(b,autoplay=false){const was=playing;pause();cancelDemo();beat=Math.max(0,Math.min(endBeat,b));if($('#section-loop').checked){const s=sectionAt(beat);loopBounds=[s.start,s.end];}lastCue='';if((was||autoplay)&&await audioReady())resumeAt(beat);renderAll();}
function updatePlayButton(){$('#full-play').textContent=playing?'Ⅱ':'▶';$('#full-play').setAttribute('aria-label',playing?'暂停全乐章':'播放全乐章');$('.transport').classList.toggle('is-playing',playing);$('#block-follow').textContent=playing?'Ⅱ 暂停乐章':'▶ 跟着乐章看积木';}
function scheduler(){
  if(!playing)return;
  const b=clockBeat(),end=loopBounds&&$('#section-loop').checked?loopBounds[1]:endBeat;
  if(b>=end){if(loopBounds&&$('#section-loop').checked){silence('score');resumeAt(loopBounds[0]);}else{pause();beat=endBeat;}return;}
  const horizon=b+.14/Q*speed;
  while(index<notes.length&&notes[index].b<horizon){const n=notes[index++];if(n.b>=end)break;if(!enabled.has(n.f))continue;const time=baseTime+(n.b-baseBeat)*Q/speed;if(time<ctx.currentTime-.03)continue;sound(n.p,Math.min(n.d,end-n.b)*Q/speed,Math.max(ctx.currentTime,time),n.f,n.v,panFor(n.track),'score');}
}
setInterval(scheduler,25);
$('#full-play').onclick=()=>playing?pause():play();
$('#full-reset').onclick=()=>seek(0);
$('#seek').max=endBeat;$('#seek').oninput=e=>seek(Number(e.target.value));
$('#full-speed').onchange=e=>{const was=playing;pause();speed=Number(e.target.value);if(was)resumeAt(beat);};
$('#section-loop').onchange=e=>{const b=clockBeat(),s=sectionAt(b);loopBounds=e.target.checked?[s.start,s.end]:null;if(playing){pause();resumeAt(beat);}};
$('#volume').oninput=e=>{if(master)master.gain.setTargetAtTime(Number(e.target.value)/100*.42,ctx.currentTime,.025);};
$('#block-follow').onclick=()=>playing?pause():play();

// Demonstrations share the audio engine, but never overlap full-movement playback.
const original=[{b:.5,d:.5,p:67},{b:1,d:.5,p:67},{b:1.5,d:.5,p:67},{b:2,d:2,p:63}];
let demo=null,demoToken=0;
function cancelDemo(){demoToken++;demo=null;silence('demo');$$('.note.playing,.sequence .playing').forEach(e=>e.classList.remove('playing'));$$('.roll-playhead').forEach(e=>e.remove());}
async function runDemo(parts,{loop=false,status='#demo-status',label='正在播放',period=4.8}={}){
  pause();cancelDemo();const token=demoToken;
  if(!await audioReady()||token!==demoToken)return;
  const demoSpeed=Number($('#demo-speed').value),sec=.45/demoSpeed;
  demo={parts,start:ctx.currentTime+.08,sec,period,loop,status,label,token,cycle:-1};
  demoTick();
}
function demoTick(){
  if(!demo)return;
  let t=(ctx.currentTime-demo.start)/demo.sec;
  if(t>=demo.period){
    if(demo.loop){demo.start+=demo.period*demo.sec;demo.cycle=-1;t=(ctx.currentTime-demo.start)/demo.sec;}
    else{$(demo.status).textContent='播放完成。再听一遍，或试试另一种变化。';demo=null;$$('.note.playing,.sequence .playing').forEach(e=>e.classList.remove('playing'));$$('.roll-playhead').forEach(e=>e.remove());return;}
  }
  if(demo.cycle<0){for(const part of demo.parts)for(const n of part.notes)sound(n.p,n.d*demo.sec,demo.start+(part.offset+n.b)*demo.sec,n.f||part.f||'piano',n.v??part.v??.8,n.pan||0);demo.cycle=1;}
  $$('.note.playing,.sequence .playing').forEach(e=>e.classList.remove('playing'));
  const activePart=demo.parts.findLast(p=>t>=p.offset);
  if(activePart)$(demo.status).textContent=activePart.label||demo.label;
  for(const part of demo.parts){
    const local=t-part.offset;
    if(part.roll){const roll=$(part.roll);let head=roll.querySelector('.roll-playhead');if(!head){head=document.createElement('div');head.className='roll-playhead';roll.append(head);}head.style.display=local>=0&&local<=part.length?'block':'none';head.style.left=(local/part.length*100)+'%';
      part.notes.forEach((n,i)=>{if(local>=n.b&&local<n.b+n.d)roll.querySelector(`[data-note="${i}"]`)?.classList.add('playing');});}
    if(part.slot!==undefined&&local>=0&&local<part.length)$('#sequence').children[part.slot]?.classList.add('playing');
  }
}
function pitchName(p){return ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'][p%12];}
function drawRoll(selector,ns,{changed=false,length=4.5,f='piano',v=.8,shortLabels=true}={}){
  const el=$(selector);el.innerHTML='<span class="rest">静默</span>';
  // Both comparisons use the same fixed pitch scale, so transposition stays visible.
  const lo=48,hi=80;
  ns.forEach((n,i)=>{
    const button=document.createElement('button');button.className='note'+((n.changed??changed)?' changed':'')+(n.secondary?' secondary':'');button.dataset.note=i;
    button.style.left=(n.b/length*100)+'%';button.style.width=(Math.max(.18,n.d)/length*100-1)+'%';button.style.top=(12+(hi-n.p)/(hi-lo)*118)+'px';button.style.height=(n.v===undefined?38:26+n.v*20)+'px';
    button.innerHTML=`<span>${shortLabels?(n.d<=.6?'短':'长'):pitchName(n.p)}</span><small>${pitchName(n.p)}${Math.floor(n.p/12)-1}</small>`;
    button.title=`第 ${i+1} 个音，${pitchName(n.p)}，${n.d} 拍`;button.setAttribute('aria-label',button.title+'，点击试听');
    button.onclick=async()=>{pause();cancelDemo();const token=demoToken;if(await audioReady()&&token===demoToken){sound(n.p,Math.min(1.6,n.d*.45),ctx.currentTime,n.f||f,n.v??v,n.pan||0);button.classList.add('playing');setTimeout(()=>button.classList.remove('playing'),Math.min(1600,n.d*450));}};el.append(button);
  });
}
drawRoll('#motif-roll',original);drawRoll('#original-roll',original);
$('#motif-play').onclick=()=>runDemo([{notes:original,offset:0,length:4.5,roll:'#motif-roll',label:'听：三次同高的短音，接一个往下落的长音。'}],{loop:$('#motif-loop').checked});
$('#motif-loop').onchange=e=>{if(demo&&demo.status==='#demo-status')demo.loop=e.target.checked;};
$('#demo-speed').onchange=()=>{cancelDemo();$('#demo-status').textContent='速度已改变，点击播放重新听。';};
$('#demo-stop').onclick=()=>{cancelDemo();$('#demo-status').textContent='已停止。';};
$$('.stop-demo').forEach(b=>b.onclick=()=>{cancelDemo();$('#compare-status').textContent='已停止。';$('#sequence-status').textContent='已停止。';});
$('#reveal-motif').onclick=()=>{if(!ctx){$('#demo-status').textContent='先点击“听这四个音”，让耳朵有一个参照。';return;}$('#motif-discovery').hidden=false;$('#reveal-motif').hidden=true;};
const variations=[
 {name:'原始动机',sub:'一个起点',desc:'什么都不改。先让耳朵记住这个形状。',keep:'音高、节奏、音色与强弱都相同。',ns:original,changed:false},
 {name:'换音高',sub:'整体搬家',desc:'四个音一起往高处搬。你还能认出同样的说话方式吗？',keep:'保留：短短短长、前三音同高、末音下落。改变：整体音高。',ns:original.map(n=>({...n,p:n.p+5}))},
 {name:'换乐器',sub:'换个声音',desc:'让同一组音符换一种声音说话。这里用木管式合成音色示范。',keep:'保留：音高和时值。改变：音色。合成音不等于真实乐器采样。',ns:original,f:'wood'},
 {name:'改变强弱',sub:'从轻到重',desc:'从轻声开始，逐渐加强。音符没换，语气已经变了。',keep:'保留：音高、节奏、音色。改变：响度（方块厚度也跟着变化）。',ns:original.map((n,i)=>({...n,v:[.16,.32,.58,1][i]}))},
 {name:'拆掉一部分',sub:'留下碎片',desc:'删去第三个短音，留下一个可听见的空缺。你会不会在心里把它补上？',keep:'绿色：保留音符的音高和时间位置。虚线：被删除的第三个短音，留下静默。',ns:original.filter((_,i)=>i!==2),changed:false},
 {name:'只留下节奏',sub:'拿掉高低',desc:'把四个音都放在同一高度，只留下时间关系。熟悉感还剩多少？',keep:'保留：短短短长。改变：去掉音高起伏。这里仍用有音高的同音敲击来示范。',ns:original.map(n=>({...n,p:60}))},
 {name:'和声部叠起来',sub:'同时发生',desc:'上面保留原来的四个音，下面加一条较低的持续线。上下两层同时存在。',keep:'绿色：保留的原动机。蓝色：新增低声部；上下位置不同，开始时间可以相同。',ns:[...original.map(n=>({...n,changed:false})),{b:.5,d:3.5,p:48,f:'wood',secondary:true,pan:.35}],length:4.5},
 {name:'前后互相追逐',sub:'错开进入',desc:'同一个材料晚一点进入，形成你追我赶。第二个声部开始时，第一个还没结束。',keep:'绿色：原动机。蓝色：晚两拍、低八度进入的第二份；节奏关系保持不变。',ns:[...original.map(n=>({...n,changed:false})),...original.map(n=>({...n,b:n.b+2,p:n.p-12,secondary:true,pan:.4}))],length:6.5}
];
let variation=1;
$('#transform-options').innerHTML=variations.map((v,i)=>`<button data-v="${i}" aria-pressed="false">${v.name}<small>${v.sub}</small></button>`).join('');
function selectVariation(i){cancelDemo();variation=i;const v=variations[i];$$('[data-v]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.v)===i);b.setAttribute('aria-pressed',String(Number(b.dataset.v)===i));});$('#variation-title').textContent=v.name;$('#variation-description').textContent=v.desc;$('#invariants').textContent=v.keep;drawRoll('#variation-roll',v.ns,{changed:v.changed??true,length:v.length||4.5,f:v.f||'piano'});if(i===4){const ghost=document.createElement('span');ghost.className='deleted-note';ghost.textContent='删去';$('#variation-roll').append(ghost);}$('#compare-status').textContent='先听相同的地方，再听不同的地方。';}
$$('[data-v]').forEach(b=>b.onclick=()=>selectVariation(Number(b.dataset.v)));selectVariation(1);
$('#hear-original').onclick=()=>runDemo([{notes:original,offset:0,length:4.5,roll:'#original-roll',label:'正在听：原版。'}],{status:'#compare-status'});
$('#hear-variation').onclick=()=>{const v=variations[variation];runDemo([{notes:v.ns,f:v.f,offset:0,length:v.length||4.5,roll:'#variation-roll',label:'正在听：'+v.name}],{status:'#compare-status',period:(v.length||4.5)+.3});};
$('#hear-compare').onclick=()=>{const v=variations[variation];runDemo([{notes:original,offset:0,length:4.5,roll:'#original-roll',label:'先听：原版。'},{notes:v.ns,f:v.f,offset:5.3,length:v.length||4.5,roll:'#variation-roll',label:'再听：'+v.name+'。'}],{status:'#compare-status',loop:$('#compare-loop').checked,period:5.3+(v.length||4.5)+.7});};
$('#compare-loop').onchange=e=>{if(demo&&demo.status==='#compare-status')demo.loop=e.target.checked;};
$('#reveal-transform').onclick=()=>{$('#transform-discovery').hidden=false;$('#reveal-transform').hidden=true;};

// Mixer; only the family selection changes, not the transport's position.
$('#family-controls').innerHTML=Object.entries(familyLabels).map(([f,label])=>`<div class="family-row"><label><input type="checkbox" data-family="${f}" checked><span style="color:${colors[f]}">●</span>${label}</label><button data-solo="${f}" aria-pressed="false">单听</button></div>`).join('');
function refreshMixer(){const was=playing;if(was)pause();$$('[data-family]').forEach(e=>e.checked=enabled.has(e.dataset.family));$$('[data-solo]').forEach(e=>{const solo=enabled.size===1&&enabled.has(e.dataset.solo);e.classList.toggle('selected',solo);e.setAttribute('aria-pressed',String(solo));});if(was)resumeAt(beat);}
$$('[data-family]').forEach(e=>e.onchange=()=>{if(e.checked)enabled.add(e.dataset.family);else enabled.delete(e.dataset.family);refreshMixer();});
$$('[data-solo]').forEach(e=>e.onclick=()=>{enabled.clear();enabled.add(e.dataset.solo);refreshMixer();});
$('#all-families').onclick=()=>{Object.keys(familyLabels).forEach(f=>enabled.add(f));refreshMixer();};

// Timeline and contextual links.
$('#timeline').innerHTML=sections.map((s,i)=>`<button data-section="${i}" style="flex:${s.end-s.start}" aria-label="跳到${s.title}，${s.term}"><span class="t-num">${s.n}</span><span class="t-title">${s.title}</span><span class="t-term">${s.term}</span><span class="timeline-progress" style="width:0"></span></button>`).join('');
$$('[data-section]').forEach(e=>e.onclick=()=>{changeTab('movement',false);seek(sections[Number(e.dataset.section)].start,true);});
$('#terms-toggle').onclick=()=>{const show=$('#timeline').classList.toggle('show-terms');$('#terms-toggle').setAttribute('aria-expanded',String(show));$('#terms-toggle').textContent=show?'收起结构名称 −':'听过之后，显示结构名称 ＋';$('#timeline-hint').textContent=show?'相邻的核心区域与对比区域，合起来才是呈示部；它反复一次。之后是展开部、再现部、尾声。小节边界采用 Wieland 的分析。':'电脑上按播放时长分配宽度，窄屏自动换行。先认识两片区域，再听它们怎样被拆解、带回和延伸。';};
const landmarks=[[1,'开头的两次敲门'],[59,'号角打开新区域'],[63,'歌唱下面的节奏'],[196,'声部间的应答'],[248,'熟悉的材料回来'],[268,'双簧管的独白'],[374,'还没结束'],[478,'最后认出它']];
$('#landmark-buttons').innerHTML=landmarks.map(([bar,text])=>`<button data-bar="${bar}">${text} <span class="muted">· ${bar}</span></button>`).join('');
$$('[data-bar]').forEach(e=>e.onclick=()=>seek(barBeat(Number(e.dataset.bar)),true));
$('#source-jump').onclick=()=>seek(barBeat(lessonAt(clockBeat()).src),true);
$('#blocks-to-b').onclick=()=>{changeTab('movement');seek(barBeat(63),true);};
function fmt(sec){return Math.floor(sec/60)+':'+String(Math.floor(sec%60)).padStart(2,'0');}
$('#duration-time').textContent=fmt(endBeat*Q);$('#timeline-end').textContent=fmt(endBeat*Q)+'（1×）';
let lastCue='';
function renderAll(){
  const b=Math.max(0,Math.min(endBeat,clockBeat())),p=position(b),l=lessonAt(b),s=sectionAt(b);
  $('#seek').value=b;$('#current-time').textContent=fmt(b*Q);$('#live-clock').textContent=fmt(b*Q);
  $('#measure-label').textContent=`第 ${p.bar} 小节${p.repeat?' · 呈示部反复':''}${p.bar===268?' · 自由段':''}`;
  $('#block-measure').textContent=$('#measure-label').textContent;
  $('#transport-title').textContent=playing?s.title:'原谱合成导听';
  $('#transport-subtitle').textContent=`${playing?'正在播放':'可离线播放'} · 第 ${p.bar} 小节${p.repeat?' · 反复':''} · 时钟按 1× 标尺`;
  $$('[data-section]').forEach((e,i)=>{e.classList.toggle('active',sections[i]===s);e.classList.toggle('source-region',sections[i]!==s&&sectionAt(barBeat(l.src))===sections[i]);e.setAttribute('aria-current',sections[i]===s?'true':'false');e.querySelector('.timeline-progress').style.width=Math.max(0,Math.min(100,(b-sections[i].start)/(sections[i].end-sections[i].start)*100))+'%';});
  const key=l.bar+':'+p.repeat;
  if(key!==lastCue){
    lastCue=key;$('#now-title').textContent=l.title;$('#now-description').textContent=l.desc;$('#operation-label').textContent=l.op;
    $('#source-jump').textContent=l.bar===1&&!p.repeat?'第 1 小节 · 最初的种子':`回听第 ${l.src} 小节 · 此段起点距它约 ${Math.round((barBeat(l.bar,p.repeat)-barBeat(l.src))*Q)} 秒`;
    $('#block-flow').innerHTML=l.flow.map((v,i)=>i%2===0?`<span class="flow-block ${v.toLowerCase()}">${v}<small>${{A:'四音种子',B:'舒展歌唱',C:'连接推进',D:'节奏骨架','独奏':'双簧管的独白'}[v]}</small></span>`:`<span class="flow-operation">${v}<br>→</span>`).join('');$('#block-explanation').textContent=l.explain;
  }
  const live=playing?notes.filter(n=>n.b<=b&&n.b+n.d>b&&enabled.has(n.f)):[];
  const activeTracks=[...new Set(live.map(n=>n.track))];$('#active-instruments').textContent=playing?(activeTracks.map(t=>names[t]).join(' · ')||(enabled.size?'短暂的静默，也属于音乐。':'当前所有声部均已静音。')):'按下播放，跟着音符看。';
  const matched=playing?motifMatches.filter(m=>m.b<=b&&m.end>b&&enabled.has(families[m.track])):[];
  $('#event-detail').textContent=matched.length?'音符匹配：三次同音短击，接较长音 · '+[...new Set(matched.map(m=>names[m.track]))].join('、'):'上方文字解释当前段落；方块与声部名单实时跟随原谱音符。';
  if($('#movement').classList.contains('active'))drawScore(b,live);
}
function drawScore(b,live){
  const canvas=$('#score-canvas'),dpr=Math.min(window.devicePixelRatio||1,2),w=canvas.clientWidth,h=240;if(!w)return;
  if(canvas.width!==Math.round(w*dpr)){canvas.width=Math.round(w*dpr);canvas.height=h*dpr;}
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const past=3,span=18,start=b-past,low=32,high=97,left=37,x=at=>left+(at-start)/span*(w-left),y=p=>16+(high-p)/(high-low)*(h-36);
  c.font='9px -apple-system, sans-serif';c.fillStyle='#939786';
  [36,48,60,72,84,96].forEach(p=>{c.fillText(pitchName(p)+(Math.floor(p/12)-1),0,y(p)+3);c.strokeStyle='#e6e8dc';c.beginPath();c.moveTo(left,y(p));c.lineTo(w,y(p));c.stroke();});
  for(let i=Math.floor(start/2)*2;i<start+span;i+=2){c.strokeStyle='#e9eadf';c.beginPath();c.moveTo(x(i),0);c.lineTo(x(i),h);c.stroke();if(i>=0){c.fillStyle='#929684';c.fillText(position(i).bar,x(i)+3,h-2);}}
  const visible=notes.filter(n=>n.b+n.d>start&&n.b<start+span);
  for(const n of visible){const isLive=playing&&n.b<=b&&n.b+n.d>b&&enabled.has(n.f);c.globalAlpha=enabled.has(n.f)?(isLive?1:.5):.1;c.fillStyle=colors[n.f];c.fillRect(Math.max(left,x(n.b)),y(n.p)-3,Math.max(2,x(n.b+n.d)-Math.max(left,x(n.b))-1),6);if(isLive){c.strokeStyle=colors[n.f];c.strokeRect(Math.max(left,x(n.b))-1,y(n.p)-5,Math.max(2,x(n.b+n.d)-Math.max(left,x(n.b)))+1,10);}}
  c.globalAlpha=1;c.strokeStyle='#293628';c.lineWidth=1.5;c.beginPath();c.moveTo(x(b),0);c.lineTo(x(b),h);c.stroke();c.fillStyle='#293628';c.fillText('现在',x(b)+5,12);c.lineWidth=1;
}

// Re-composition sandbox. B and C are excerpts from first violin, not invented quotations.
function excerpt(startBar,beats){const start=(startBar-1)*2;return SCORE.tracks[7].notes.filter(n=>n[0]>=start&&n[0]<start+beats).map(n=>({b:n[0]-start+.5,d:Math.min(n[1],start+beats-n[0]),p:n[2],f:'strings'}));}
const blocks={A:{notes:original,length:4.5},B:{notes:excerpt(63,8),length:9},C:{notes:excerpt(34,8),length:9},D:{notes:original.map(n=>({...n,p:60})),length:4.5}};
let sequence=['A','A','B','D'];
function renderSequence(){$('#sequence').innerHTML=sequence.map((v,i)=>`<button data-slot="${i}" data-kind="${v}" title="点击移除第 ${i+1} 块" aria-label="第 ${i+1} 块 ${v}，点击移除">${v}</button>`).join('');$$('[data-slot]').forEach(e=>e.onclick=()=>{cancelDemo();sequence.splice(Number(e.dataset.slot),1);renderSequence();});$('#sequence-play').disabled=!sequence.length;$('#sequence-undo').disabled=!sequence.length;$('#sequence-clear').disabled=!sequence.length;}
$$('[data-block]').forEach(e=>e.onclick=()=>{cancelDemo();if(sequence.length>=12){$('#sequence-status').textContent='先用这 12 块听一段；移除一些后可以继续添加。';return;}sequence.push(e.dataset.block);renderSequence();$('#sequence-status').textContent='已加入 '+e.dataset.block+'。点击序列中的任意积木可移除。';});
$('#sequence-undo').onclick=()=>{cancelDemo();sequence.pop();renderSequence();};$('#sequence-clear').onclick=()=>{cancelDemo();sequence=[];renderSequence();};
$('#sequence-play').onclick=()=>{if(!sequence.length)return;let offset=0;const parts=sequence.map((v,i)=>{const block=blocks[v],part={...block,offset,slot:i,label:`你的组合 · 第 ${i+1} 块 ${v}`};offset+=block.length+.5;return part;});runDemo(parts,{status:'#sequence-status',period:offset});};renderSequence();
function changeTab(id,scroll=true){cancelDemo();$$('.panel').forEach(p=>p.classList.toggle('active',p.id===id));$$('[data-tab]').forEach(b=>{b.classList.toggle('selected',b.dataset.tab===id);b.setAttribute('aria-pressed',String(b.dataset.tab===id));});if(scroll) $('.tabs').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});renderAll();}
$$('[data-tab]').forEach(b=>b.onclick=()=>changeTab(b.dataset.tab));$$('[data-next]').forEach(b=>b.onclick=()=>changeTab(b.dataset.next));
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','SELECT','BUTTON','TEXTAREA'].includes(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();playing?pause():play();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();cancelDemo();}});
let lastRender=0;function frame(now){if(now-lastRender>45){renderAll();if(demo)demoTick();lastRender=now;}requestAnimationFrame(frame);}requestAnimationFrame(frame);renderAll();
// Expose read-only-style diagnostic hooks for local verification; not required by the UI.
window.LAB={barBeat,position,notes,sections,lessons,blocks,motifMatches,getState:()=>({playing,beat:clockBeat(),speed,demo:!!demo,audioState:ctx?.state,voiceCount:voices.size,enabled:[...enabled]}),rms:()=>{if(!analyser)return 0;const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);},seek,pause};
})();
