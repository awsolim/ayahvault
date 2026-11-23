import { test, expect } from '@playwright/test';

test('lazy routes and reader drawers keep their loading spinner centered', async ({ page }) => {
 const delays = new Map<string, Promise<void>>();
 const releases: Array<() => void> = [];
 for (const path of ['/src/library/EntryEditor.tsx', '/src/apps/mushaf/TranslationDrawer.tsx']) {
   delays.set(path, new Promise<void>(resolve => releases.push(resolve)));
 }
 await page.route(url => delays.has(url.pathname), async route => {
   await delays.get(new URL(route.request().url()).pathname);
   await route.continue();
 });
 const spinner = page.getByRole('status').filter({ hasText: 'Loading…' });
 async function expectCentered() {
   await expect(spinner).toBeVisible();
   const { x, y, width, height } = (await spinner.boundingBox())!;
   const { innerWidth, innerHeight } = await page.evaluate(() => ({
     innerWidth: window.innerWidth, innerHeight: window.innerHeight,
   }));
   expect(Math.abs(x + width / 2 - innerWidth / 2)).toBeLessThan(2);
   expect(Math.abs(y + height / 2 - innerHeight / 2)).toBeLessThan(2);
 }
 try {
   await page.goto('/library/new', { waitUntil: 'domcontentloaded' });
   await expectCentered();
   releases[0]();
   await expect(page.getByRole('button', { name: 'Add Ayah', exact: true })).toBeVisible();

   await page.route('**/api.alquran.cloud/**', route => route.fulfill({ json: { data: { text: 'Translation preview.' } } }));
   await page.goto('/mushaf?page=3');
   await page.getByRole('button', { name: 'Select ayah 2:6', exact: true }).press('Enter');
   await page.getByRole('button', { name: 'Ayah Information' }).click();
   await expectCentered();
   releases[1]();
   await expect(page.getByRole('dialog', { name: 'Ayah Information' })).toBeVisible();
 } finally {
   releases.forEach(release => release());
 }
});

test('touching an ayah has no focus box while keyboard focus remains visible', async ({ page }) => {
 await page.goto('/mushaf?page=3');
 const ayah = page.getByRole('button', { name: 'Select ayah 2:6', exact: true });
 await expect(ayah).toBeVisible();
 await ayah.tap();
 await ayah.focus(); // Safari may retain focus after a touch.
 const appearance = () => ayah.evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, stroke: getComputedStyle(el).stroke }));
 expect(await appearance()).toEqual({ outline: 'none', stroke: 'none' });
 await page.keyboard.press('Tab');
 await ayah.focus();
 expect((await appearance()).stroke).not.toBe('none');
});

test('the Mushaf shows colored banners and returns directly from a new entry to its green marker', async ({ page }) => {
 async function countColors(screenshot: Buffer) {
   return page.evaluate(async png => {
     const image = new Image();
     image.src = 'data:image/png;base64,' + png;
     await image.decode();
     const canvas = document.createElement('canvas');
     canvas.width = image.width;
     canvas.height = image.height;
     const context = canvas.getContext('2d')!;
     context.drawImage(image, 0, 0);
     const { data } = context.getImageData(0, 0, image.width, image.height);
     let gold = 0;
     let green = 0;
     for (let i = 0; i < data.length; i += 4) {
       const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
       if (r > 110 && r - g > 20 && g - b > 20) gold++;
       if (g < 185 && g - r > 25 && g - b > 8) green++;
     }
     return { gold, green };
   }, screenshot.toString('base64'));
 }

 await page.goto('/mushaf?page=1');
 for (const pageNumber of [1, 2]) {
   if (pageNumber === 2) await page.getByLabel('Mushaf page').selectOption('2');
   const artwork = page.locator('.reading-page:not([inert]) .mushaf-fitted-image');
   await expect.poll(async () => (await countColors(await artwork.screenshot({ scale: 'css' }))).gold).toBeGreaterThan(60);
 }
 await page.getByLabel('Mushaf page').selectOption('50');
 const bannerPage = page.locator('.reading-page:not([inert]) .mushaf-fitted-image');
 await expect.poll(async () => (await countColors(await bannerPage.screenshot({ scale: 'css' }))).green).toBeGreaterThan(750);
 await page.getByLabel('Mushaf page').selectOption('3');
 await page.getByRole('button', { name: 'Select ayah 2:6', exact: true }).press('Enter');
 await page.getByRole('button', { name: 'Add to this ayah' }).click();
 await page.getByRole('button', { name: 'Mutashabihat', exact: true }).click();
 await expect(page).toHaveURL(/\/library\/new\?ayah=2:6$/);
 const passages = page.locator('.comparison-passages article');
 await expect(passages).toHaveCount(1);
 await expect(passages.first()).toContainText('2:6');
 await page.getByRole('button', { name: 'Save Entry', exact: true }).click();
 await expect(page).toHaveURL(/\/mushaf\?page=3$/);
 const marker = page.getByRole('button', { name: 'Open Mutashabihat for 2:6' });
 await expect(marker).toBeVisible();
 await expect.poll(async () => (await countColors(await marker.screenshot({ scale: 'css' }))).green).toBeGreaterThan(20);
 await marker.tap();
 await expect(page.getByRole('dialog', { name: /Mutashabihat/ })).toBeVisible();
});

test('MemoBuddy has raised gradient controls without a touch focus box on the ayah', async ({ page }) => {
 await page.route('**/api.alquran.cloud/**', route => route.fulfill({ json: { data: { text: 'Translation preview.' } } }));
 await page.goto('/memobuddy');
 await page.getByRole('button', { name: 'Whole Quran', exact: true }).tap();
 const go = page.getByRole('button', { name: 'Go', exact: true });
 await go.tap();
 const flip = page.locator('.verse-flip');
 await expect(flip).toBeVisible();
 const style = await go.evaluate(el => { const s=getComputedStyle(el); return { image:s.backgroundImage, shadow:s.boxShadow, radius:s.borderRadius }; });
 expect(style.image).toContain('linear-gradient');
 expect(style.shadow).not.toBe('none');
 expect(style.radius).toBe('8px');
 await page.screenshot({ path:'test-results/memobuddy-polished-phone.png', fullPage:true });
 await flip.tap();
 await flip.focus();
 expect(await flip.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none');
 await page.keyboard.press('Tab');
 await flip.focus();
 expect(await flip.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
 await expect(page.getByRole('link', { name: 'Open in Mushaf' })).toBeVisible();
 const info = page.getByRole('button', { name: 'Ayah information' });
 const reference = page.locator('.verse-reference');
 const navigation = page.getByRole('navigation', { name: 'Adjacent ayahs' });
 const navigationY = () => navigation.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
 const textNavigationY = await navigationY();
 await expect(reference).toBeHidden();
 await info.getByText('Ayah information').tap();
 await expect(info).toHaveAttribute('aria-pressed', 'true');
 await expect(reference).toBeVisible();
 expect(await navigationY()).toBeCloseTo(textNavigationY, 1);
 await info.getByText('Shown').tap();
 await expect(info).toHaveAttribute('aria-pressed', 'false');
 await expect(reference).toBeHidden();
 expect(await navigationY()).toBeCloseTo(textNavigationY, 1);
 const preview = page.getByRole('button', { name: 'Preview', exact: true });
 await preview.tap({ position: { x: 90, y: 35 } });
 await expect(preview).toHaveAttribute('aria-pressed', 'true');
 await page.getByRole('button', { name: 'Increase preview words' }).tap();
 await expect(preview).toHaveAttribute('aria-pressed', 'true');
});

test('the reader anchors actions to the ayah and keeps navigation on the Mushaf', async ({ page }) => {
 await page.route('**/api.alquran.cloud/**', route => route.fulfill({ json: { data: { text: 'Translation preview.' } } }));
 await page.goto('/mushaf?page=3');
 const ayah = page.getByRole('button', { name: 'Select ayah 2:6', exact: true });
 await expect(ayah).toBeVisible();
 await expect(page.locator('.reading-page:not([inert]) .mushaf-fitted-image use')).toHaveCount(5);
 const box = (await ayah.boundingBox())!;
 await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
 await page.mouse.down();
 await page.waitForTimeout(375);
 await page.mouse.up();
 const actions = page.locator('.ayah-action-bar');
 await expect(actions).toBeVisible();
 await expect(actions.getByRole('button')).toHaveCount(4);
 await expect(page.getByRole('button', { name: 'Clear ayah highlight' })).toHaveCount(0);
 const actionsBox = (await actions.boundingBox())!;
 const highlights = await page.locator('.reading-page:not([inert]) .selected-region').all();
 const ayahBoxes = await Promise.all(highlights.map(region => region.boundingBox()));
 expect(actionsBox.y).toBeGreaterThanOrEqual(Math.max(...ayahBoxes.map(region => region!.y + region!.height)));
 await page.getByRole('button', { name: 'Ayah Information' }).click();
 await expect(page.getByText('Translation preview.')).toBeVisible();
 await page.getByRole('button', { name: 'Close', exact: true }).click();
 await page.getByRole('button', { name: 'Add to this ayah' }).click();
 await page.getByRole('button', { name: 'Bookmark ayah' }).click();
 await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible();
 await page.getByRole('button', { name: 'Move reading marker here' }).click();
 await expect(page.getByRole('button', { name: 'Reading marker is here' })).toBeDisabled();
 await page.getByRole('button', { name: 'Add comment' }).click();
 await page.getByRole('textbox', { name: 'Ayah comment' }).fill('Review this ayah.');
 await page.getByRole('button', { name: 'Save comment' }).click();
 const chrome = page.locator('.reader-chrome');
 const outside = page.getByRole('button', { name: 'Select ayah 2:15', exact: true });
 await outside.tap();
 await expect(actions).toHaveCount(0);
 await expect(page.locator('.selected-region')).toHaveCount(0);
 await expect(chrome).toHaveAttribute('aria-hidden', 'false');
 await outside.tap();
 await expect(chrome).toHaveAttribute('aria-hidden', 'true');
 await ayah.press('Enter');
 await expect(actions).toBeVisible();
 await outside.tap();
 await expect(actions).toHaveCount(0);
 await expect(chrome).toHaveAttribute('aria-hidden', 'true');
 await outside.tap();
 await expect(chrome).toHaveAttribute('aria-hidden', 'false');
 await page.getByLabel('Mushaf surah').selectOption('3');
 await expect(page.locator('.reader-folio')).toHaveText('50');
 await expect(page.getByLabel('Mushaf page')).toHaveValue('50');
 await page.getByLabel('Mushaf page').selectOption('3');
 await expect(page.getByLabel('Mushaf surah')).toHaveValue('2');
 await page.locator('.reading-stream').evaluate(element => {
   const touch = (x: number) => new Touch({ identifier: 1, target: element, clientX: x, clientY: 150 });
   element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touch(0)] }));
   element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [touch(100)] }));
 });
 await expect(page.locator('.reader-folio')).toHaveText('4');
 await expect(page).toHaveURL(/\/mushaf/);
 await page.getByRole('link', { name: 'Back to Surahs' }).click();
 await expect(page.getByRole('link', { name: /Last Viewed Page.*Page 4/ })).toBeVisible();
 await page.getByRole('link', { name: /Your Marker.*Page 3/ }).click();
 await expect(ayah).toHaveAttribute('aria-pressed', 'true');
});

test('translation swipes cross page boundaries and highlight the displayed ayah', async ({ page, context }) => {
 await page.route('**/api.alquran.cloud/**', route => {
   const verse = route.request().url().split('/').at(-2);
   const longerText = verse === '2:6' ? ' A longer translation that needs room to scroll.'.repeat(24) : '';
   return route.fulfill({ json: { data: { text: 'English for ' + verse + longerText } } });
 });
 await page.goto('/mushaf?page=2');
 await page.getByRole('button', { name: 'Select ayah 2:5', exact: true }).press('Enter');
 await page.getByRole('button', { name: 'Ayah Information' }).click();
 const drawer = page.getByRole('dialog', { name: 'Ayah Information' });
 const translation = drawer.getByRole('tabpanel', { name: 'Translation' });
 await expect(translation.getByText('English for 2:5')).toBeVisible();
 const arabic = translation.locator('[lang=ar]');
 await expect(arabic).not.toBeEmpty();
 await expect(translation.locator('.ayah-translation-reference')).toHaveText('Al-Baqarah 5');
 const drawerBox = await drawer.boundingBox();
 await drawer.getByRole('tab', { name: 'Tafsir' }).click();
 await expect(drawer.getByRole('tabpanel', { name: 'Tafsir' })).toBeVisible();
 await expect(drawer.getByText('Tafsir coming soon')).toHaveCount(0);
 expect(await drawer.boundingBox()).toEqual(drawerBox);
 await drawer.getByRole('tab', { name: 'Translation' }).click();
 const cdp = await context.newCDPSession(page);
 async function swipe(right: boolean, y: number) {
   const { x, width } = (await translation.boundingBox())!;
   const start = x + width * (right ? 0.25 : 0.75);
   const end = x + width * (right ? 0.75 : 0.25);
   await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y }] });
   await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: end, y }] });
   await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
 }
 const arabicBox = (await arabic.boundingBox())!;
 await swipe(true, arabicBox.y + arabicBox.height / 2);
 await expect(translation.getByText('English for 2:6')).toBeVisible();
 expect(await drawer.boundingBox()).toEqual(drawerBox);
 await translation.evaluate(el => { el.scrollTop = 120; });
 expect(await translation.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
 expect(await drawer.boundingBox()).toEqual(drawerBox);
 await expect(page.locator('.reading-page:not([inert]) [aria-label="Select ayah 2:6"]')).toHaveAttribute('aria-pressed', 'true');
 const stream = page.locator('.reading-stream');
 const expectScrolledTo = (n: number) => expect.poll(() => stream.evaluate(el => 604 - el.scrollLeft / el.clientWidth)).toBeCloseTo(n, 1);
 await expectScrolledTo(3);
 const panelBox = (await translation.boundingBox())!;
 await swipe(false, panelBox.y + 45);
 await expect(translation.getByText('English for 2:5')).toBeVisible();
 await expect(page.locator('.reading-page:not([inert]) [aria-label="Select ayah 2:5"]')).toHaveAttribute('aria-pressed', 'true');
 await expectScrolledTo(2);
 expect(await translation.evaluate(el => el.scrollTop)).toBe(0);
 const navigation = (await drawer.getByRole('navigation').boundingBox())!;
 const blankY = panelBox.y + panelBox.height - 18;
 expect(blankY).toBeGreaterThan(navigation.y + navigation.height);
 await swipe(true, blankY);
 await expect(translation.locator('.ayah-translation-reference')).toHaveText('Al-Baqarah 6');
});

test('play settings accept typed and picked ranges and repeat ayahs and ranges', async ({ page }) => {
 await page.addInitScript(() => {
   const playing = new WeakSet<HTMLMediaElement>();
   Object.defineProperties(HTMLMediaElement.prototype, {
     paused: { get() { return !playing.has(this); } },
     src: { get() { return this.dataset.mockSrc || ''; }, set(value: string) { this.dataset.mockSrc = value; } },
   });
   HTMLMediaElement.prototype.play = function () {
     playing.add(this);
     this.dispatchEvent(new Event('playing'));
     return Promise.resolve();
   };
   HTMLMediaElement.prototype.pause = function () {
     if (playing.delete(this)) this.dispatchEvent(new Event('pause'));
   };
 });
 await page.goto('/mushaf?page=3');
 const start = page.getByRole('button', { name: 'Select ayah 2:16', exact: true });
 await start.press('Enter');
 await page.getByRole('button', { name: 'Play settings' }).click();
 const settings = page.getByRole('dialog', { name: 'Play settings' });
 await expect(settings.getByLabel('Reciter')).toHaveValue('minshawi');
 await settings.getByLabel('To ayah').fill('2:15');
 await settings.getByRole('button', { name: 'Save settings' }).click();
 await expect(settings.getByRole('alert')).toContainText('at or after');
 await settings.getByRole('button', { name: 'Pick from Mushaf' }).click();
 await expect(page.getByText('Tap the start ayah.')).toBeVisible();
 await start.tap();
 await expect(page.locator('.range-start-region').first()).toBeVisible();
 await page.getByLabel('Mushaf page').selectOption('4');
 await page.getByRole('button', { name: 'Select ayah 2:17', exact: true }).tap();
 await expect(settings.getByLabel('From ayah')).toHaveValue('2:16');
 await expect(settings.getByLabel('To ayah')).toHaveValue('2:17');
 await settings.getByLabel('Speed').selectOption('1.25');
 await settings.getByLabel('Ayah repeat').selectOption('2');
 await settings.getByLabel('Range repeat').selectOption('2');
 await settings.getByRole('button', { name: 'Play range' }).click();
 const audio = page.locator('.reading-view audio');
 await expect.poll(() => audio.evaluate((el: HTMLAudioElement) => el.playbackRate)).toBe(1.25);
 for (const ayah of [16, 16, 17, 17, 16, 16, 17, 17]) {
   await expect(audio).toHaveAttribute('data-mock-src', new RegExp('0020' + ayah + '\\.mp3$'));
   await expect(page.locator('.reader-folio')).toHaveText(ayah === 16 ? '3' : '4');
   await audio.dispatchEvent('ended');
 }
 await expect(page.getByRole('button', { name: 'Play ayah', exact: true })).toBeVisible();
 await page.reload();
 await start.press('Enter');
 await page.getByRole('button', { name: 'Play settings' }).click();
 await expect(settings.getByLabel('To ayah')).toHaveValue('2:17');
 await expect(settings.getByLabel('Speed')).toHaveValue('1.25');
 await settings.getByLabel('To ayah').fill('2:18');
 await settings.getByRole('button', { name: 'Save settings' }).click();
 await page.getByRole('button', { name: 'Play settings' }).click();
 await expect(settings.getByLabel('To ayah')).toHaveValue('2:18');
});
