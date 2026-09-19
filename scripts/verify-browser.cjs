/* Local functional acceptance: run with node scripts/verify-browser.cjs.
   Requires Playwright; PLAYWRIGHT_MODULE may point to a bundled installation. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/panzijie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1120},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const checks=[];
 await page.goto('file://'+path.join(root,'index.html'));
 await page.waitForFunction(()=>window.LAB);
 const data=await page.evaluate(()=>({notes:LAB.notes.length,match:LAB.motifMatches.length,b:[1,59,125,248,268,269,303,374,478,502].map(bar=>[bar,LAB.barBeat(bar),LAB.position(LAB.barBeat(bar)).bar]),blocks:Object.fromEntries(Object.entries(LAB.blocks).map(([k,v])=>[k,v.notes.length]))}));
 for(const [expected,,actual] of data.b)assert.equal(actual,expected);
 assert.equal(data.b.find(x=>x[0]===374)[1],1004);
 assert.equal(data.b.find(x=>x[0]===269)[1]-data.b.find(x=>x[0]===268)[1],12);
 assert.ok(data.notes>9000);assert.ok(data.match>30);assert.ok(data.blocks.B>2&&data.blocks.C>2);checks.push({check:'score-data-and-bar-mapping',data});
 await page.screenshot({path:path.join(root,'preview-desktop.png'),fullPage:true,animations:'disabled'});
 await page.click('#motif-play');await page.waitForTimeout(360);
 const first=await page.evaluate(()=>({state:LAB.getState(),rms:LAB.rms(),highlight:document.querySelectorAll('.note.playing').length}));
 assert.equal(first.state.audioState,'running');assert.ok(first.rms>.001);assert.ok(first.highlight>0);checks.push({check:'motif-real-audio-and-note-highlight',...first});
 await page.click('#demo-stop');await page.waitForTimeout(160);assert.equal(await page.evaluate(()=>LAB.getState().demo),false);assert.ok(await page.evaluate(()=>LAB.rms())<.0001);
 await page.selectOption('#demo-speed','0.4');await page.check('#motif-loop');await page.click('#motif-play');await page.waitForTimeout(700);assert.ok(await page.evaluate(()=>LAB.rms())>.001);await page.click('#demo-stop');await page.selectOption('#demo-speed','1');checks.push({check:'slow-loop-controls-and-stop',pass:true});
 await page.click('[data-tab="transform"]');
 for(let i=0;i<8;i++){
  await page.click(`[data-v="${i}"]`);await page.click('#hear-variation');await page.waitForTimeout(380);
  assert.ok(await page.evaluate(()=>LAB.rms())>.0002,`variation ${i} must generate PCM`);
  await page.locator('#transform .stop-demo').click();
 }
 await page.click('[data-v="7"]');await page.click('#hear-compare');await page.waitForTimeout(2800);assert.match(await page.textContent('#compare-status'),/再听/);assert.ok(await page.evaluate(()=>LAB.rms())>.0002);checks.push({check:'eight-transformations-and-sequential-comparison',pass:true});
 await page.click('[data-tab="movement"]');await page.click('#full-play');await page.waitForTimeout(700);
 assert.equal(await page.evaluate(()=>LAB.getState().playing),true);assert.ok(await page.evaluate(()=>LAB.rms())>.001);
 await page.click('#full-play');const paused=await page.evaluate(()=>LAB.getState().beat);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>LAB.getState().beat),paused);assert.ok(await page.evaluate(()=>LAB.rms())<.0001);checks.push({check:'full-play-and-pause-audio-clock',pass:true});
 await page.click('[data-bar="268"]');await page.waitForTimeout(220);assert.match(await page.textContent('#measure-label'),/268/);assert.match(await page.textContent('#now-title'),/一个人/);
 await page.click('[data-solo="wood"]');assert.deepEqual(await page.evaluate(()=>LAB.getState().enabled),['wood']);await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>LAB.rms())>.0001);await page.click('#all-families');assert.equal(await page.evaluate(()=>LAB.getState().enabled.length),4);
 await page.click('[data-section="4"]');await page.waitForTimeout(100);assert.match(await page.textContent('#measure-label'),/125/);assert.match(await page.textContent('#now-title'),/陌生/);
 await page.selectOption('#full-speed','0.5');const a=await page.evaluate(()=>LAB.getState().beat);await page.waitForTimeout(600);const b=await page.evaluate(()=>LAB.getState().beat);assert.ok(b-a>.6&&b-a<1.3,`speed delta ${b-a}`);
 await page.selectOption('#full-speed','1');await page.check('#section-loop');await page.evaluate(()=>LAB.seek(741.8,true));await page.waitForTimeout(330);const wrapped=await page.evaluate(()=>LAB.getState().beat);assert.ok(wrapped>=496&&wrapped<500,`loop wrapped ${wrapped}`);await page.uncheck('#section-loop');
 await page.click('[data-section="6"]');await page.waitForTimeout(200);assert.match(await page.textContent('#measure-label'),/374/);assert.match(await page.textContent('#now-title'),/继续/);checks.push({check:'landmarks-solo-seeking-speed-and-loop-boundary',wrapped,pass:true});
 await page.screenshot({path:path.join(root,'preview-movement.png'),fullPage:true,animations:'disabled'});
 await page.click('[data-tab="blocks"]');assert.equal(await page.evaluate(()=>LAB.getState().playing),true);await page.click('#block-follow');await page.click('#sequence-clear');assert.equal(await page.isDisabled('#sequence-play'),true);
 await page.click('[data-block="A"]');await page.click('[data-block="B"]');await page.click('[data-block="D"]');assert.equal(await page.locator('#sequence button').count(),3);await page.click('#sequence-play');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>LAB.getState().playing),false);assert.ok(await page.evaluate(()=>LAB.rms())>.001);assert.ok(await page.locator('#sequence .playing').count()>0);await page.locator('#blocks .stop-demo').click();await page.click('#sequence-undo');assert.equal(await page.locator('#sequence button').count(),2);checks.push({check:'sandbox-edit-and-audio-exclusive-with-movement',pass:true});
 await page.setViewportSize({width:390,height:844});
 for(const tab of ['motif','transform','movement','blocks']){await page.click(`[data-tab="${tab}"]`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no mobile overflow ${tab}`);}
 await page.click('[data-tab="motif"]');await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(root,'preview-mobile.png'),fullPage:true,animations:'disabled'});
 checks.push({check:'all-four-tabs-mobile-390px-no-horizontal-overflow',pass:true});
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});
 const mobilePage=await mobileContext.newPage();const mobileErrors=[];mobilePage.on('pageerror',e=>mobileErrors.push(String(e)));
 await mobilePage.goto('file://'+path.join(root,'index.html'));await mobilePage.waitForFunction(()=>window.LAB);
 await mobilePage.locator('#motif-play').tap();await mobilePage.waitForTimeout(450);
 const mobileFirstPlay=await mobilePage.evaluate(()=>({state:LAB.getState(),rms:LAB.rms(),error:document.querySelector('#audio-error').textContent}));
 assert.equal(mobileFirstPlay.state.audioState,'running');assert.ok(mobileFirstPlay.rms>.001);assert.deepEqual(mobileErrors,[]);checks.push({check:'fresh-mobile-first-gesture-starts-audio',...mobileFirstPlay});
 await mobileContext.close();
 await page.click('[data-tab="movement"]');await page.evaluate(()=>LAB.seek(1261.7,true));await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>LAB.getState().playing),false);assert.equal(await page.evaluate(()=>LAB.getState().beat),1262);checks.push({check:'movement-end-stops-at-final-bar',pass:true});
 assert.deepEqual(errors,[]);checks.push({check:'browser-console-errors',errors});
 fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify({at:new Date().toISOString(),environment:'Chromium / local file:// / Web Audio PCM analyser',checks},null,2));
 console.log(JSON.stringify(checks,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
