const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('proto03-input-sound.html','utf8');
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
function param(){return {value:0,setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}}}
function node(){const n={gain:param(),frequency:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){},disconnect(){},start(){},stop(){}};audioNodes.push(n);return n}
window.AudioContext=class{constructor(){this.state='running';this.currentTime=0;this.sampleRate=44100;this.destination=node()}resume(){return Promise.resolve()}createGain(){return node()}createDynamicsCompressor(){return node()}createWaveShaper(){return node()}createOscillator(){return node()}createBiquadFilter(){return node()}createBufferSource(){return node()}createBuffer(c,n){return{getChannelData:()=>new Float32Array(n)}}};
const context={window,document,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>1000},requestAnimationFrame(){},setTimeout,clearTimeout,setInterval,clearInterval,console};
let script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
script=script.replace('window.__kamiTest={','window.__qa={levelChoice,endGame,tickClear,setupClear(){board=empty();board[15].fill(0);score=490;beginClear([15],100,1,false)},audio:()=>({seVolume,seMuted,masterGain}),soft:()=>soft};window.__kamiTest={');
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