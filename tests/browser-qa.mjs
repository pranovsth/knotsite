import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const report = { checks: [], consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [], screenshots: [] };
const check = async (name, task) => {
  try { const detail = await task(); report.checks.push({ name, pass: true, detail }); console.log(`PASS ${name}${detail ? `: ${JSON.stringify(detail)}` : ''}`); }
  catch (error) { report.checks.push({ name, pass: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
};
const observe = (page, size) => {
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push({ size, message: message.text() }); });
  page.on('pageerror', (error) => report.pageErrors.push({ size, message: error.message }));
  page.on('requestfailed', (request) => report.failedRequests.push({ size, url: request.url(), error: request.failure()?.errorText }));
  page.on('response', (response) => { if (response.status() >= 400) report.badResponses.push({ size, url: response.url(), status: response.status() }); });
};
const overflow = (page) => page.evaluate(() => ({ width: window.innerWidth, body: document.body.scrollWidth, document: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll('body *')].filter((element) => { const box = element.getBoundingClientRect(); return box.width && (box.left < -1 || box.right > innerWidth + 1); }).slice(0, 12).map((element) => ({ tag: element.tagName, class: element.className?.baseVal ?? element.className, width: Math.round(element.getBoundingClientRect().width), x: Math.round(element.getBoundingClientRect().x) })) }));
const revealPage = async (page) => {
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 650) { window.scrollTo(0, y); await new Promise((resolve) => setTimeout(resolve, 80)); } });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
};
const screenshot = async (page, name, fullPage = false) => { const path = `artifacts/${name}.png`; await page.screenshot({ path, fullPage, timeout: 30000 }); report.screenshots.push(path); };
const settle = async (page) => {
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator('.hero-title .word, .hero-phone-wrap').evaluateAll((elements) => elements.every((element) => getComputedStyle(element).display === 'none' || Number(getComputedStyle(element).opacity) > 0.99)), { timeout: 30000 }).toBeTruthy();
};
const closeEditor = async (page) => {
  const dialog = page.getByRole('dialog', { name: 'Your Knot Site editor' });
  const inner = dialog.getByRole('button', { name: 'Close site editor', exact: true });
  if (await inner.isVisible()) await inner.click();
  else await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await expect(dialog).not.toBeVisible();
};

if (process.env.QA_MODE !== 'mobile') {
const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
observe(desktop, 'desktop');
desktop.setDefaultTimeout(10000);
await desktop.goto(baseURL, { waitUntil: 'networkidle' });
await settle(desktop);
await check('desktop initial rendering', async () => { await expect(desktop.getByRole('heading', { name: 'Tie your digital world together' })).toBeVisible(); return { title: await desktop.title(), canvasCount: await desktop.locator('canvas').count() }; });
await screenshot(desktop, 'desktop-hero');
await check('desktop no horizontal page overflow', async () => { const info = await overflow(desktop); expect(info.document).toBeLessThanOrEqual(info.width + 1); return info; });
await check('Three.js WebGL rendering and keyboard control', async () => {
  const knot = desktop.getByRole('img', { name: /^Interactive blue knot sculpture/ });
  await expect(knot).toBeVisible();
  const canvas = knot.locator('canvas');
  await expect(canvas).toBeVisible();
  const info = await canvas.evaluate((element) => { const gl = element.getContext('webgl2'); return { width: element.width, height: element.height, webgl2: !!gl, lost: gl?.isContextLost() }; });
  expect(info.webgl2).toBeTruthy(); expect(info.lost).toBeFalsy();
  await knot.focus(); await desktop.keyboard.press('ArrowRight'); await desktop.keyboard.press('Home');
  return info;
});
await check('invalid slug validation', async () => { const form = desktop.locator('.hero .claim-form'); await form.locator('input').fill('!'); await form.getByRole('button', { name: 'Claim your knot.site' }).click(); await expect(desktop.locator('.hero [role="alert"]')).toContainText('3'); });
await check('valid slug opens editor', async () => { const form = desktop.locator('.hero .claim-form'); await form.locator('input').fill('qa-studio'); await form.getByRole('button', { name: 'Claim your knot.site' }).click(); await expect(desktop.getByRole('dialog', { name: 'Your Knot Site editor' })).toBeVisible(); });
await check('edit, save and HTML export', async () => {
  const dialog = desktop.getByRole('dialog', { name: 'Your Knot Site editor' });
  await dialog.getByRole('textbox', { name: 'Your name', exact: true }).fill('QA Studio Test');
  await expect(dialog.getByRole('heading', { name: /Hey, I'm QA Studio Test/ })).toBeVisible();
  await dialog.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Draft saved');
  const downloaded = desktop.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export HTML', exact: true }).click();
  const download = await downloaded;
  await download.saveAs(`artifacts/${download.suggestedFilename()}`);
  await screenshot(desktop, 'desktop-editor');
  return { filename: download.suggestedFilename(), saved: await desktop.evaluate(() => JSON.parse(localStorage.getItem('knot-site:draft:qa-studio')).name) };
});
await check('close and reopen saved draft through Log In', async () => {
  await closeEditor(desktop);
  await desktop.getByRole('button', { name: 'Log In', exact: true }).click();
  const login = desktop.getByRole('dialog', { name: 'Continue your draft' });
  await login.getByRole('textbox', { name: 'Draft username' }).fill('qa-studio');
  await login.getByRole('button', { name: 'Open my workspace' }).click();
  const editor = desktop.getByRole('dialog', { name: 'Your Knot Site editor' });
  await expect(editor.getByRole('textbox', { name: 'Your name', exact: true })).toHaveValue('QA Studio Test');
  await closeEditor(desktop);
});
await check('template dialog opens and dismisses', async () => { await desktop.getByRole('button', { name: 'Preview The Minimalist template', exact: true }).first().click(); const dialog = desktop.getByRole('dialog', { name: 'Template preview' }); await expect(dialog.getByRole('heading', { name: 'The Minimalist' })).toBeVisible(); await desktop.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); });
await check('section tabs update content', async () => { const tab = desktop.getByRole('tab', { name: 'Gallery', exact: true }); await tab.click(); await expect(tab).toHaveAttribute('aria-selected', 'true'); await expect(desktop.getByText('A picture of your world.', { exact: true })).toBeVisible(); });
await check('FAQ accordion toggles', async () => { const button = desktop.getByRole('button', { name: 'Where is my site saved?', exact: true }); await button.click(); await expect(button).toHaveAttribute('aria-expanded', 'true'); await expect(desktop.locator('#faq-answer-2')).toContainText('not registered or published'); await button.click(); await expect(button).toHaveAttribute('aria-expanded', 'false'); });
await revealPage(desktop);
await check('all loaded images have valid assets', async () => { const broken = await desktop.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)); expect(broken).toEqual([]); return { count: await desktop.locator('img').count() }; });
await screenshot(desktop, 'desktop-full', true);
await desktop.close();
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
observe(mobile, 'mobile');
mobile.setDefaultTimeout(10000);
await mobile.goto(baseURL, { waitUntil: 'networkidle' });
await settle(mobile);
await screenshot(mobile, 'mobile-hero');
await check('mobile no horizontal page overflow', async () => { const info = await overflow(mobile); expect(info.document).toBeLessThanOrEqual(info.width + 1); return info; });
await check('mobile navigation opens and closes', async () => { await mobile.getByRole('button', { name: 'Open navigation' }).click(); const nav = mobile.getByRole('navigation', { name: 'Mobile navigation' }); await expect(nav).toBeVisible(); await nav.getByRole('link', { name: 'Explore sections' }).click(); await expect(nav).not.toBeVisible(); });
await check('mobile editor claim and controls', async () => {
  await mobile.evaluate(() => window.scrollTo(0, 0));
  const form = mobile.locator('.hero .claim-form');
  await form.locator('input').fill('mobile-qa');
  await form.getByRole('button', { name: 'Claim your knot.site' }).click();
  const editor = mobile.getByRole('dialog', { name: 'Your Knot Site editor' });
  await expect(editor).toBeVisible();
  await editor.getByRole('textbox', { name: 'Your name', exact: true }).fill('Mobile Studio');
  await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(editor.getByRole('status')).toContainText('Draft saved');
  await screenshot(mobile, 'mobile-editor');
  const info = await overflow(mobile); expect(info.document).toBeLessThanOrEqual(info.width + 1);
  await closeEditor(mobile);
  return info;
});
await revealPage(mobile);
await screenshot(mobile, 'mobile-full', true);
await mobile.close();

const small = await browser.newPage({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
observe(small, 'mobile320');
await small.goto(baseURL, { waitUntil: 'networkidle' });
await check('320px mobile no horizontal page overflow', async () => { const info = await overflow(small); expect(info.document).toBeLessThanOrEqual(info.width + 1); return info; });
await screenshot(small, 'mobile-320');
await small.close();

const reduced = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
observe(reduced, 'reduced-motion');
await reduced.goto(baseURL, { waitUntil: 'networkidle' });
await check('reduced motion page and WebGL remain usable', async () => { await expect(reduced.getByRole('heading', { name: 'Tie your digital world together' })).toBeVisible(); await expect(reduced.locator('canvas')).toBeVisible(); await reduced.getByRole('img', { name: /^Interactive blue knot sculpture/ }).focus(); await reduced.keyboard.press('ArrowRight'); });
await check('section tabs no longer blocked by decorative rings', async () => { const tab = reduced.getByRole('tab', { name: 'Gallery', exact: true }); await tab.click(); await expect(tab).toHaveAttribute('aria-selected', 'true'); await expect(reduced.getByText('A picture of your world.', { exact: true })).toBeVisible(); });
await check('keyboard skip link is reachable', async () => { await reduced.reload({waitUntil:'networkidle'}); await reduced.keyboard.press('Tab'); await expect(reduced.getByRole('link', { name: 'Skip to content' })).toBeFocused(); });
await screenshot(reduced, 'desktop-reduced-motion');
await browser.close();
await writeFile(`artifacts/browser-qa${process.env.QA_MODE === 'mobile' ? '-mobile' : ''}-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.checks.filter((check) => check.pass).length, failed: report.checks.filter((check) => !check.pass).length, consoleErrors: report.consoleErrors, pageErrors: report.pageErrors, failedRequests: report.failedRequests, badResponses: report.badResponses }, null, 2));
if (report.checks.some((check) => !check.pass) || report.pageErrors.length) process.exitCode = 1;
