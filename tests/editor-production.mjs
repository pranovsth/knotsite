import { chromium, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// Exercise export boundaries without requiring a browser or trusting stored data.
const source = await readFile('src/components/SiteEditor.jsx', 'utf8');
const helpers = source.slice(source.indexOf('const TEMPLATES'), source.indexOf('export default function'));
const helperContext = vm.createContext({ URL, localStorage: { getItem: () => JSON.stringify({ template: 'constructor', accent: 'red;}body{display:none', name: 'Saved name' }) } });
vm.runInContext(helpers, helperContext);
assert.equal(vm.runInContext("readDraft('test', 'designer').template", helperContext), 'designer');
assert.equal(vm.runInContext("readDraft('test', 'designer').accent", helperContext), '#eda3ba');
const escapedHTML = vm.runInContext(`portfolioHTML({ ...defaultProfile('test', 'designer'), name: '<script>alert(1)</script>', bio: '<img src=x onerror=alert(1)>', socialURL: 'javascript:alert(1)' })`, helperContext);
assert.ok(!escapedHTML.includes('<script>'));
assert.ok(!escapedHTML.includes('<img'));
assert.ok(!escapedHTML.includes('javascript:'));
assert.ok(escapedHTML.includes('&lt;script&gt;'));
assert.ok(escapedHTML.includes('mailto:hello@example.com'));
assert.ok(escapedHTML.includes('id="project-one"'));
assert.equal(vm.runInContext("contactLink(' hello+work@example.com ')", helperContext), 'mailto:hello%2Bwork@example.com');
assert.equal(vm.runInContext("socialLink('data:text/html,unsafe')", helperContext), '');
console.log('PASS: stored-data validation, HTML escaping, mailto encoding and URL scheme checks.');

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', acceptDownloads: true });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const open = async () => {
  await page.getByRole('button', { name: 'Create Account', exact: true }).first().click();
  const editor = page.getByRole('dialog', { name: 'Your Knot Site editor' });
  await expect(editor).toBeVisible();
  return editor;
};
try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  let editor = await open();
  const name = '<img src=x onerror="window.__knotXSS=1">';
  const bio = '<script>window.__knotXSS=2</script> & "escaped"';
  await editor.getByRole('textbox', { name: 'Your name', exact: true }).fill(name);
  await editor.getByRole('textbox', { name: 'A little about you' }).fill(bio);
  await editor.getByRole('textbox', { name: 'Contact email', exact: true }).fill('hello+portfolio@example.com');
  await editor.getByRole('textbox', { name: 'Social profile' }).fill('javascript:alert(1)');
  await expect(editor.getByRole('textbox', { name: 'Social profile' })).toHaveAttribute('aria-invalid', 'true');
  await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(editor.getByRole('status')).toHaveText('Draft saved on this device.');
  const downloadPromise = page.waitForEvent('download');
  await editor.getByRole('button', { name: 'Export HTML', exact: true }).click();
  const download = await downloadPromise;
  const html = await readFile(await download.path(), 'utf8');
  expect(html).toContain('&lt;img');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('javascript:');
  expect(html).toContain('mailto:hello%2Bportfolio@example.com');
  const exported = await browser.newPage();
  await exported.setContent(html);
  expect(await exported.locator('script, img[onerror]').count()).toBe(0);
  expect(await exported.evaluate(() => window.__knotXSS)).toBeUndefined();
  await expect(exported.getByRole('heading', { name })).toBeVisible();
  await exported.close();
  await editor.getByRole('button', { name: 'Close site editor', exact: true }).click();
  editor = await open();
  await expect(editor.getByRole('textbox', { name: 'Your name', exact: true })).toHaveValue(name);
  console.log('PASS: live editing, real download, injection resistance and draft reopen persistence.');

  await editor.getByRole('tab', { name: 'Content', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(editor.getByRole('tab', { name: 'Style', exact: true })).toBeFocused();
  await expect(editor.getByRole('tab', { name: 'Style', exact: true })).toHaveAttribute('aria-selected', 'true');
  await editor.getByRole('button', { name: 'Edit your name', exact: true }).click();
  await expect(editor.getByRole('textbox', { name: 'Your name', exact: true })).toBeFocused();
  await editor.getByRole('textbox', { name: 'Contact email', exact: true }).fill('invalid');
  await editor.getByRole('link', { name: "Let's make it happen" }).click();
  await expect(editor.getByRole('textbox', { name: 'Contact email', exact: true })).toBeFocused();
  await expect(editor.getByRole('status')).toContainText('valid contact email');
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'QuotaExceededError'); };
  });
  await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(editor.getByRole('status')).toContainText('could not save');
  await expect(editor.locator('.ke-save-note')).toHaveText('Unsaved changes');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.evaluate(() => {
    window.originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = () => { throw new Error('Download unavailable'); };
  });
  await editor.getByRole('button', { name: 'Export HTML', exact: true }).click();
  await expect(editor.getByRole('status')).toContainText('could not start');
  await page.evaluate(() => { URL.createObjectURL = window.originalCreateObjectURL; });
  console.log('PASS: editor tab keyboard navigation, preview-to-input focus and truthful storage/download failure states.');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await editor.getByRole('textbox', { name: 'Your name', exact: true }).fill('A'.repeat(100));
    const inputSize = await editor.getByRole('textbox', { name: 'Your name', exact: true }).evaluate((element) => getComputedStyle(element).fontSize);
    expect(parseInt(inputSize)).toBeGreaterThanOrEqual(16);
    const bounds = await editor.locator('.knot-editor').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    const overflow = await editor.locator('.knot-editor').evaluate((element) => ({ width: element.clientWidth, scroll: element.scrollWidth }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.width + 1);
  }
  console.log('PASS: 390px/320px editor boundaries, long-name wrapping and mobile input sizing.');
  expect(errors).toEqual([]);
} finally {
  await browser.close();
}
