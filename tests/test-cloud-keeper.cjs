const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('proto03-cloud-keeper.html','utf8');
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
const context={Math,window,document,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame(){},setTimeout,clearTimeout,setInterval,clearInterval,console};
let script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
script=script.replace('window.__kamiTest={','window.__qa={drawCloudKeeper,makeCue,syncBgm,bgm:()=>({bgmVolume,bgmMuted,bgmSource,bgmBuffer,bgmBus,bgmOffset,audioCtx,musicKind,bgmFinished}),sceneOffset,sceneScale,draw,finalizeLockProgress,setScore(v){score=v},levelChoice,endGame,tickClear,setupClear(){board=empty();board[15].fill(0);score=490;beginClear([15],100,1,false)},audio:()=>({seVolume,seMuted,masterGain}),soft:()=>soft};window.__kamiTest={');
vm.runInNewContext(script,context);
const state=()=>window.__kamiTest.getState(),qa=window.__qa;
function key(code,repeat=false){window.emit('keydown',{code,repeat,target:document.activeElement||els.game})}
function up(code){window.emit('keyup',{code})}
function press(code){key(code);up(code)}

delete window.AudioContext;
press('Enter');assert.equal(state().phase,'playing');assert.equal(state().godReleaseMs,650);
qa.draw(1060);assert.equal(state().godReleaseMs,590);
press('KeyP');const paused=state().godReleaseMs;qa.draw(1120);assert.equal(state().godReleaseMs,paused);
press('KeyP');qa.draw(1180);assert.ok(state().godReleaseMs<paused);
window.__kamiTest.hardDrop();assert.equal(state().godReleaseMs,650);
for(let angle=-360;angle<=720;angle++){
 const scale=qa.sceneScale(),offset=qa.sceneOffset(angle),theta=angle*Math.PI/180;
 assert.equal(scale,516/540);
 for(const [x,y] of [[50,44],[324,44],[324,482],[50,482],[139,8],[235,8]]){
  const px=270+offset.x+scale*((x-270)*Math.cos(theta)-(y-270)*Math.sin(theta));
  const py=270+offset.y+scale*((x-270)*Math.sin(theta)+(y-270)*Math.cos(theta));
  assert.ok(px>=11.9999&&px<=528.0001&&py>=11.9999&&py<=528.0001, 'Clipping at '+angle);
 }
}
window.__kamiTest.beginRage();qa.drawCloudKeeper();
window.__kamiTest.start();window.__kamiTest.omen();qa.drawCloudKeeper();
qa.setupClear();qa.tickClear(500);assert.equal(state().clearFx,null);assert.equal(state().phase,'choice');press('Digit1');assert.equal(state().phase,'playing');
const old=fs.readFileSync('proto03-music-suite.html','utf8');
const section=x=>x.slice(x.indexOf(' const audioStorageKey='),x.indexOf(' const storageKey='));
assert.equal(section(html),section(old),'Audio implementation unchanged');
console.log('PASS: release on spawn, pause/resume animation, constant size, board and keeper bounds at every degree, oracle/rage drawing, line clear and choice, unchanged music.');
