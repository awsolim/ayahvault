import { test, expect } from '@playwright/test';

test('ayah tap defaults to translation, toggles information, navigates halves, and generates within the selection', async ({ page }) => {
 let translations=0;
 await page.addInitScript(()=>{Math.random=()=>0.2;});
 await page.route('**/api.alquran.cloud/**',route=>{translations++;return route.fulfill({json:{data:{text:'English preview for this ayah.'}}});});
 await page.goto('/memobuddy');
 const setting=page.getByLabel('Tap on Ayah',{exact:true});
 await expect(setting).toHaveValue('translation');
 await page.getByRole('button',{name:'By Surah',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Surah number',exact:true}).fill('1');
 await page.getByRole('button',{name:'Go',exact:true}).click();
 const card=page.locator('.verse-flip');
 const reference=page.locator('.verse-reference');
 await expect(reference).toContainText('Ayah 2');
 await card.tap();
 await expect(page.getByText('English preview for this ayah.')).toBeVisible();
 await expect(card).toHaveAttribute('aria-pressed','true');
 await card.tap();
 await expect(card).toHaveAttribute('aria-pressed','false');
 expect(translations).toBe(1);

 await setting.selectOption('information');
 await expect(reference).toHaveAttribute('aria-hidden','true');
 const before=await card.boundingBox();
 await card.tap();
 await expect(reference).toHaveAttribute('aria-hidden','false');
 expect(await card.boundingBox()).toEqual(before);
 await card.tap();
 await expect(reference).toHaveAttribute('aria-hidden','true');
 expect(translations).toBe(1);

 await setting.selectOption('adjacent');
 await expect(page.getByText('Left: Previous · Right: Next',{exact:true})).toBeVisible();
 const box=(await card.boundingBox())!;
 await card.tap({position:{x:box.width*.15,y:box.height/2}});
 await expect(reference).toContainText('Ayah 1');
 await card.tap({position:{x:box.width*.85,y:box.height/2}});
 await expect(reference).toContainText('Ayah 2');
 await card.press('ArrowRight');
 await expect(reference).toContainText('Ayah 3');
 await card.press('ArrowLeft');
 await expect(reference).toContainText('Ayah 2');
 await card.press('Enter');
 await expect(reference).toContainText('Ayah 3');

 await setting.selectOption('generate');
 await page.evaluate(()=>{Math.random=()=>0.7;});
 await card.tap();
 await expect(reference).toContainText('Surah 1 · Ayah 5');
 expect(translations).toBe(1);
 await page.getByRole('link',{name:'Mushaf',exact:true}).first().click();
 await page.getByRole('link',{name:'MemoBuddy',exact:true}).click();
 await expect(setting).toHaveValue('generate');
 await expect(reference).toContainText('Ayah 5');
 await page.reload();
 await expect(setting).toHaveValue('generate');
 await expect(page.getByRole('button',{name:'By Surah',exact:true})).toHaveAttribute('aria-pressed','true');
 await card.tap();
 await expect(reference).toContainText('Ayah 2');
 await page.screenshot({path:'test-results/memobuddy-tap-settings-phone.png',fullPage:true});
});

test('audio tap behavior is separate from playback buttons and survives a new browser session', async ({ page, context }) => {
 let playCalls=0;
 await page.exposeFunction('recordAudioPlay',()=>{playCalls++;});
 await page.addInitScript(()=>{
  Math.random=()=>0.2;
  HTMLMediaElement.prototype.play=function(){void (window as unknown as {recordAudioPlay:()=>Promise<void>}).recordAudioPlay();return Promise.resolve();};
  HTMLMediaElement.prototype.pause=function(){};
 });
 await page.route('**/api.alquran.cloud/**',route=>route.fulfill({json:{data:{text:'Audio translation preview.'}}}));
 await page.goto('/memobuddy');
 await page.getByRole('button',{name:'By Surah',exact:true}).click();
 await page.getByRole('spinbutton',{name:'Surah number',exact:true}).fill('1');
 await page.getByRole('button',{name:'Go',exact:true}).click();
 const setting=page.getByLabel('Tap on Ayah',{exact:true});
 await setting.selectOption('generate');
 await page.getByRole('button',{name:'Text / Audio',exact:true}).click();
 await page.evaluate(()=>{Math.random=()=>0.7;});
 await page.getByRole('button',{name:'Play audio',exact:true}).click();
 await expect.poll(()=>playCalls).toBe(1);
 await expect(page.locator('.verse-reference')).toContainText('Ayah 2');
 await page.locator('.memo-audio-tap-surface').tap();
 await expect(page.locator('.verse-reference')).toContainText('Ayah 5');
 await setting.selectOption('translation');
 await page.locator('.memo-audio-tap-surface').tap();
 await expect(page.getByText('Audio translation preview.')).toBeVisible();
 await page.getByRole('button',{name:'Show Arabic ayah',exact:true}).tap();
 await expect(page.locator('.memo-audio-tap-surface')).toBeVisible();
 await setting.selectOption('information');
 // A new tab has fresh session state, but retains this device preference.
 const another=await context.newPage();await another.goto('http://127.0.0.1:5187/memobuddy');
 await expect(another.getByLabel('Tap on Ayah',{exact:true})).toHaveValue('information');
 await another.close();
});
