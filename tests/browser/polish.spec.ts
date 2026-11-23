import { test, expect } from '@playwright/test';

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
});
