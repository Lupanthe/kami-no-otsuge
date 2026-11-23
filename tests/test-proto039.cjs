const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('proto03-bgm.html','utf8');
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.value='';this.textContent='';this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)}}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
 emit(k,e={}){for(const f of this.listeners[k]||[])f({target:this,preventDefault(){},...e})}
 append(el){el.parent=this;this.children.push(el)}
 replaceChildren(){this.children=[]}
 querySelectorAll(){return this.children.filter(x=>x.tag==='button')}
 setAttribute(){}
 focus(){document.activeElement=this;this.parent?.emit('focusin',{target:this})}
 click(){this.emit('click')}
 closest(){return ['input','select','button','textarea'].includes(this.tag)?this:null}
 getContext(){return new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})})}
}
const els={};for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))els[m[2]]=new Element(m[1]);
els.choices.append(els.start);els.difficulty.value='normal';
const document=new Element();document.getElementById=id=>els[id];document.createElement=t=>new Element(t);
const window=new Element(),saved=new Map(),audioNodes=[];
function param(){return {value:0,cancelScheduledValues(){},setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}}}
function node(){const n={gain:param(),frequency:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){},disconnect(){},start(){},stop(){}};audioNodes.push(n);return n}
window.AudioContext=class{constructor(){this.state='running';this.currentTime=0;this.sampleRate=44100;this.destination=node()}resume(){return Promise.resolve()}createGain(){return node()}createDynamicsCompressor(){return node()}createWaveShaper(){return node()}createOscillator(){return node()}createBiquadFilter(){return node()}createBufferSource(){return node()}createBuffer(c,n,rate=44100){const data=new Float32Array(n);return{duration:n/rate,sampleRate:rate,getChannelData:()=>data}}};
const context={window,document,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame(){},setTimeout,clearTimeout,setInterval,clearInterval,console};
let script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
script=script.replace('window.__kamiTest={','window.__qa={syncBgm,bgm:()=>({bgmVolume,bgmMuted,bgmSource,bgmBuffer,bgmBus,bgmOffset,audioCtx}),sceneOffset,sceneScale,draw,finalizeLockProgress,setScore(v){score=v},levelChoice,endGame,tickClear,setupClear(){board=empty();board[15].fill(0);score=490;beginClear([15],100,1,false)},audio:()=>({seVolume,seMuted,masterGain}),soft:()=>soft};window.__kamiTest={');
vm.runInNewContext(script,context);
const state=()=>window.__kamiTest.getState(),qa=window.__qa;
function key(code,repeat=false){window.emit('keydown',{code,repeat,target:document.activeElement||els.game})}
function up(code){window.emit('keyup',{code})}
function press(code){key(code);up(code)}
assert.equal(document.activeElement,els.start);press('Enter');assert.equal(state().phase,'playing');assert.equal(qa.audio().masterGain.gain.value,.8250000000000001);
press('KeyP');assert.equal(state().phase,'paused');press('ArrowDown');assert.equal(document.activeElement,els.choices.children[1]);press('ArrowUp');press('Enter');assert.equal(state().phase,'playing');
for(const digit of ['Digit1','Digit2','Digit3','Numpad3']){qa.levelChoice();assert.equal(els.choices.children.length,3);press(digit);assert.equal(state().phase,'playing')}
qa.levelChoice();press('ArrowUp');assert.equal(document.activeElement,els.choices.children[2]);key('Space');const score=state().score;key('Space',true);assert.equal(state().score,score);up('Space');
qa.endGame();press('Enter');assert.equal(state().score,0);assert.equal(state().phase,'playing');
qa.setupClear();press('KeyP');qa.tickClear(500);assert.notEqual(state().clearFx,null);press('Escape');qa.tickClear(500);assert.equal(state().clearFx,null);assert.equal(state().lines,1);assert.equal(state().phase,'choice');assert.ok(state().board.every(row=>row.every(x=>x===-1)));press('Digit1');
els.seVolume.value='100';els.seVolume.emit('input');assert.equal(qa.audio().seVolume,1);els.muteSe.click();assert.equal(qa.audio().masterGain.gain.value,0);els.muteSe.click();assert.equal(qa.audio().masterGain.gain.value,1.1);assert.ok(saved.has('kami-no-otsuge-proto036-se-settings'));
const curve=audioNodes.find(n=>n.curve)?.curve;assert.ok(curve);assert.ok(Math.max(...curve)*.9<.72);
els.seVolume.focus();key('ArrowDown');assert.equal(qa.soft(),false);up('ArrowDown');els.game.focus();els.down.emit('pointerdown');assert.equal(qa.soft(),true);els.down.emit('pointercancel');assert.equal(qa.soft(),false);
assert.ok(!/www|ｗｗ/.test(html));
console.log('PASS: start, pause/resume, arrow focus, 1/2/3/numpad choices, held-key isolation, retry, clear-before-level-dialog, volume/mute/storage, output ceiling, input controls, touch cancellation.');
window.__kamiTest.start();
const stops=[];
for(let lv=2;lv<=30;lv++){
 qa.setScore((lv-1)*500);qa.finalizeLockProgress(false);
 assert.equal(state().level,lv);
 if(state().phase==='choice'){stops.push(lv);press('Digit1')}
 else assert.equal(state().phase,'playing');
}
assert.deepEqual(stops,[2,3,5,8,12,17,23,29]);
window.__kamiTest.start();qa.setScore(5500);qa.finalizeLockProgress(false);
assert.equal(state().level,12);assert.equal(state().nextBlessingLevel,17);assert.equal(state().phase,'choice');
press('Digit1');window.__kamiTest.start();assert.equal(state().nextBlessingLevel,2);
for(let angle=-360;angle<=720;angle++){
 const theta=angle*Math.PI/180,scale=qa.sceneScale(angle);
 assert.equal(scale,516/540);
 const offset=qa.sceneOffset(angle);
 for(const [x,y] of [[50,44],[324,44],[324,482],[50,482]]){
  const px=270+offset.x+scale*((x-270)*Math.cos(theta)-(y-270)*Math.sin(theta));
  const py=270+offset.y+scale*((x-270)*Math.sin(theta)+(y-270)*Math.cos(theta));
  assert.ok(px>=11.99999&&px<=528.00001&&py>=11.99999&&py<=528.00001);
 }
}
window.__kamiTest.beginRage();qa.setScore(1500);qa.finalizeLockProgress(true);
assert.equal(state().ragePieces,3);
qa.draw(1010);
console.log('PASS: blessing intervals through level 30, multi-level catch-up, reset, rage progress, constant scale and complete board visibility at all angles, HUD render.');
window.__kamiTest.start();
assert.ok(qa.bgm().bgmSource?.loop);
const initial=qa.bgm().bgmSource;
qa.syncBgm();qa.syncBgm();assert.equal(qa.bgm().bgmSource,initial);
assert.equal(qa.bgm().bgmBus.gain.value,.35);
qa.bgm().audioCtx.currentTime=2;
press('KeyP');assert.equal(qa.bgm().bgmSource,null);assert.equal(qa.bgm().bgmOffset,2);
press('KeyP');assert.ok(qa.bgm().bgmSource);
qa.levelChoice();assert.ok(Math.abs(qa.bgm().bgmBus.gain.value-.1225)<1e-9);
document.hidden=true;document.emit('visibilitychange');assert.equal(qa.bgm().bgmSource,null);
document.hidden=false;document.emit('visibilitychange');assert.ok(qa.bgm().bgmSource);
press('Digit1');
els.muteBgm.click();assert.equal(qa.bgm().bgmSource,null);assert.equal(qa.audio().seMuted,false);
els.muteBgm.click();assert.ok(qa.bgm().bgmSource);
els.bgmVolume.value='0';els.bgmVolume.emit('input');assert.equal(qa.bgm().bgmSource,null);
els.bgmVolume.value='100';els.bgmVolume.emit('input');assert.equal(qa.bgm().bgmBus.gain.value,1);
assert.ok(saved.has('kami-no-otsuge-bgm-settings'));
qa.endGame();assert.equal(qa.bgm().bgmSource,null);
window.__kamiTest.start();assert.equal(qa.bgm().bgmOffset,0);
const buffer=qa.bgm().bgmBuffer,data=buffer.getChannelData(0);
let peak=0,sum=0;for(const x of data){assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));sum+=x*x}
assert.ok(peak<=.651&&peak>.1);assert.ok(Math.sqrt(sum/data.length)>.02);
assert.ok(Math.abs(data[0]-data[data.length-1])<.015);
console.log('PASS: loop, single voice, pause/resume offset, choice ducking, hidden-tab stop, independent mute/volume, settings, restart, finite audio and seamless boundary. Peak:',peak,'RMS:',Math.sqrt(sum/data.length));
const wav=Buffer.alloc(44+data.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(buffer.sampleRate,24);wav.writeUInt32LE(buffer.sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(data.length*2,40);for(let i=0;i<data.length;i++)wav.writeInt16LE(Math.round(data[i]*32767),44+i*2);fs.writeFileSync('bgm-akatsuki-preview.wav',wav);
