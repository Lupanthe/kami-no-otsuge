const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('proto03-chaos.html','utf8');
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
 closest(selector){return selector.split(',').includes(this.tag)?this:null}
 getContext(){return new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})})}
}
const els={};for(const m of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))els[m[2]]=new Element(m[1]);
els.choices.append(els.start);els.difficulty.value='normal';els.gameMode.value='endless';
const document=new Element();document.getElementById=id=>els[id];document.createElement=t=>new Element(t);
const window=new Element(),saved=new Map(),audioNodes=[];
function param(){return {value:0,cancelScheduledValues(){},setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}}}
function node(){const n={gain:param(),frequency:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){},disconnect(){},start(){},stop(){}};audioNodes.push(n);return n}
window.AudioContext=class{constructor(){this.state='running';this.currentTime=0;this.sampleRate=44100;this.destination=node()}resume(){return Promise.resolve()}createGain(){return node()}createDynamicsCompressor(){return node()}createWaveShaper(){return node()}createOscillator(){return node()}createBiquadFilter(){return node()}createBufferSource(){return node()}createBuffer(c,n,rate=44100){const data=new Float32Array(n);return{duration:n/rate,sampleRate:rate,getChannelData:()=>data}}};
const context={Math,window,document,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame(){},setTimeout,clearTimeout,setInterval,clearInterval,console};
let script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
script=script.replace('window.__kamiTest={','window.__qa={showIntro,openSettings,clearGame,godSpeech,randomPiece,setupPuzzle,setBoard(b){board=b},placeX(x){piece.x=x},fillTop(){board[0].fill(0)},drawCloudKeeper,makeCue,syncBgm,bgm:()=>({bgmVolume,bgmMuted,bgmSource,bgmBuffer,bgmBus,bgmOffset,audioCtx,musicKind,bgmFinished}),sceneOffset,sceneScale,draw,finalizeLockProgress,setScore(v){score=v},levelChoice,endGame,tickClear,setupClear(){board=empty();board[15].fill(0);score=490;beginClear([15],100,1,false)},audio:()=>({seVolume,seMuted,masterGain}),soft:()=>soft};window.__kamiTest={');
vm.runInNewContext(script,context);
const state=()=>window.__kamiTest.getState(),qa=window.__qa;
function key(code,repeat=false){window.emit('keydown',{code,repeat,target:document.activeElement||els.game})}
function up(code){window.emit('keyup',{code})}
function press(code){key(code);up(code)}


delete window.AudioContext;
assert.equal(state().phase,'intro');assert.equal(els.menuFields.hidden,false);
press('Digit2');assert.equal(state().phase,'settings');assert.equal(els.audioPanel.parent,els.settingsHost);
els.seVolume.value='45';els.seVolume.emit('input');assert.equal(qa.audio().seVolume,.45);
press('Escape');assert.equal(state().phase,'intro');
els.gameMode.focus();press('Tab');assert.equal(document.activeElement,els.difficulty);
press('Tab');assert.equal(document.activeElement,els.choices.children[0]);
press('Enter');assert.equal(state().phase,'playing');
press('KeyP');press('Digit2');assert.equal(state().phase,'settings');
press('Escape');assert.equal(state().phase,'paused');press('Digit1');assert.equal(state().phase,'playing');
qa.setScore(6000);qa.finalizeLockProgress(false);assert.notEqual(state().phase,'clear');
qa.endGame();assert.equal(state().phase,'over');assert.match(els.modalBody.innerHTML,/gameover-god.png/);assert.match(els.modalBody.innerHTML,/プレイありがとうございました/);
press('Digit2');assert.equal(state().phase,'intro');
const seen=new Set();
for(let i=0;i<40;i++){
 els.difficulty.value='random';els.gameMode.value='endless';press('Digit1');
 const mode=state().runDifficulty;seen.add(mode);assert.ok(['mild','normal','wild'].includes(mode));
 window.__kamiTest.omen();assert.equal(state().runDifficulty,mode);qa.showIntro();
}
assert.equal(seen.size,3);
for(const difficulty of ['mild','normal','wild']){
 els.difficulty.value=difficulty;els.gameMode.value='puzzle';
 const layouts=new Set();
 for(let trial=0;trial<100;trial++){
  qa.showIntro();press('Digit1');
  const board=state().board,occupied=board.flat().filter(c=>c!==-1).length;
  assert.equal(state().phase,'playing');assert.equal(occupied%2,0);
  assert.ok(board.slice(0,5).every(r=>r.every(c=>c===-1)));
  assert.ok(board.every(r=>r.some(c=>c===-1)));
  assert.ok(occupied>25);layouts.add(JSON.stringify(board));
  const types=new Set(Array.from({length:14},()=>JSON.stringify(qa.randomPiece().shape)));
  assert.equal(types.size,7);
 }
 assert.equal(layouts.size,100);
 // Verify the actual final line-clear path, not a direct result-screen call.
 qa.setBoard(Array.from({length:16},()=>Array(10).fill(-1)));
 qa.setupClear();qa.tickClear(500);assert.equal(state().phase,'clear');
 assert.match(els.modalBody.innerHTML,/clear-god.png/);
 assert.equal(state().piece,null);press('Digit2');
 assert.match(els.modalBody.innerHTML,/clear-god.png/);
}
els.gameMode.value='puzzle';press('Digit1');qa.fillTop();window.__kamiTest.hardDrop();assert.equal(state().phase,'over');
qa.showIntro();els.gameMode.value='endless';els.difficulty.value='normal';press('Digit1');assert.ok(state().board.every(r=>r.every(c=>c===-1)));
qa.setupClear();qa.tickClear(500);assert.equal(state().phase,'choice');press('Digit1');assert.equal(state().phase,'playing');
console.log('PASS: menu keyboard/Tab, settings round-trip and stored audio, endless does not clear, random difficulty fixed per run, 300 varied chaos boards, seven-piece bags, final-clear transitions, puzzle top-out, result art/score/thanks, mode restart, legacy line-clear choice.');


for(const mode of ['mild','normal','wild']){
 qa.showIntro();els.difficulty.value=mode;els.difficulty.emit('change');
 assert.ok(els.modalBody.innerHTML.includes(qa.godSpeech('intro',mode)));
 els.gameMode.value='endless';press('Digit1');
 qa.endGame();assert.ok(els.modalBody.innerHTML.includes(qa.godSpeech('over',mode)));
 qa.clearGame();assert.ok(els.modalBody.innerHTML.includes(qa.godSpeech('clear',mode)));
}
qa.showIntro();els.difficulty.value='random';els.difficulty.emit('change');
assert.match(els.modalBody.innerHTML,/まだ定まらぬ/);
press('Digit1');const selected=state().runDifficulty;
qa.endGame();assert.ok(els.modalBody.innerHTML.includes(qa.godSpeech('over',selected)));
console.log('PASS: entrance change, proxy/main dialogue, clear/over, resolved random speaker');