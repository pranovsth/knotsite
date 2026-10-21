import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';

// Source geometry comes from the user's Knot Site-Windows Figma frame.
// This suite intentionally has no assertions for the superseded landing page.
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const artifactDirectory = 'artifacts/exact-design';
const assets = JSON.parse(await readFile('public/assets/design-assets.json', 'utf8'));
const headings = [
  { text: 'Tie your digital world together', x: 364, y: 186, width: 882, height: 87 },
  { text: 'Use Pre-Built Sections', x: 477, y: 963, width: 652, height: 87 },
  { text: 'The easiest way to build a stunning personal site for free.', x: 352, y: 1799, width: 895, height: 174 },
  { text: 'Launch your personal brand today', x: 315, y: 2807, width: 993, height: 87 },
  { text: 'Start making your personal site now.' },
];
const report = { baseURL, startedAt: new Date().toISOString(), checks: [], consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [], screenshots: [], geometry: {}, viewports: {}, visualComparison: null };
await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const check = async (name, task) => {
  try {
    const detail = await task();
    report.checks.push({ name, pass: true, detail });
    console.log(`PASS ${name}${detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`);
  } catch (error) {
    report.checks.push({ name, pass: false, error: error.message });
    console.log(`FAIL ${name}: ${error.message}`);
  }
};
const observe = (page, viewport) => {
  page.on('pageerror', (error) => report.pageErrors.push({ viewport, message: error.message }));
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push({ viewport, message: message.text() }); });
  page.on('requestfailed', (request) => report.failedRequests.push({ viewport, url: request.url(), error: request.failure()?.errorText }));
  page.on('response', (response) => { if (response.status() >= 400) report.badResponses.push({ viewport, url: response.url(), status: response.status() }); });
};
const capture = async (page, name, fullPage = true) => {
  const path = `${artifactDirectory}/${name}.png`;
  await page.screenshot({ path, fullPage, timeout: 30000 });
  report.screenshots.push(path);
  return path;
};
const dimensions = (page) => page.evaluate(() => ({ viewport: innerWidth, body: document.body.scrollWidth, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
const rect = (element) => {
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return { x: box.left + scrollX, y: box.top + scrollY, width: box.width, height: box.height, fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, opacity: style.opacity, transform: style.transform, transformOrigin: style.transformOrigin };
};
const settle = async (page, reveal = false) => {
  await page.evaluate(() => document.fonts.ready);
  if (reveal) {
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 650) {
        scrollTo({ top: y, left: 0, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 75));
      }
      scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }
  await expect.poll(() => page.locator('h1').evaluateAll((elements) => elements.every((element) => Number(getComputedStyle(element).opacity) > 0.99)), { timeout: 15000 }).toBeTruthy();
  await page.waitForTimeout(reveal ? 1100 : 300);
};
const expectedAssetRect = (asset) => {
  const radians = asset.rotation * Math.PI / 180;
  const corners = [[0, 0], [asset.width, 0], [0, asset.height], [asset.width, asset.height]].map(([x, y]) => ({ x: asset.x + x * Math.cos(radians) - y * Math.sin(radians), y: asset.y + x * Math.sin(radians) + y * Math.cos(radians) }));
  const x = Math.min(...corners.map((corner) => corner.x));
  const y = Math.min(...corners.map((corner) => corner.y));
  return { x, y, width: Math.max(...corners.map((corner) => corner.x)) - x, height: Math.max(...corners.map((corner) => corner.y)) - y };
};
const closeEditor = async (page) => {
  const dialog = page.getByRole('dialog').last();
  const buttons = dialog.getByRole('button', { name: /Close site editor|Close dialog|Close editor/i });
  for (const button of await buttons.all()) {
    if (await button.isVisible()) { await button.click(); await expect(dialog).not.toBeVisible(); return; }
  }
  throw new Error('No visible editor close button.');
};

try {
  const sourcePage = await browser.newPage({ viewport: { width: 1600, height: 4824 }, reducedMotion: 'reduce', acceptDownloads: true, deviceScaleFactor: 1 });
  observe(sourcePage, '1600');
  sourcePage.setDefaultTimeout(10000);
  await sourcePage.goto(baseURL, { waitUntil: 'networkidle' });
  await settle(sourcePage);
  const sourceCapture = await capture(sourcePage, '1600-source-frame');
  await check('1600px source frame dimensions', async () => {
    const size = await dimensions(sourcePage);
    report.viewports['1600'] = size;
    expect(size.width).toBe(1600);
    expect(size.height).toBe(4824);
    return size;
  });
  await check('Source heading and subtitle text', async () => {
    for (const heading of headings) await expect(sourcePage.getByRole('heading', { name: heading.text, exact: true })).toBeVisible();
    await expect(sourcePage.getByText('Claim, customize, and publish - for free.', { exact: true })).toBeVisible();
    return headings.map((heading) => heading.text);
  });
  await check('Source heading boxes and typography at1600', async () => {
    const failures = [];
    report.geometry.headings = [];
    for (const heading of headings.filter((item) => item.x !== undefined)) {
      const locator = sourcePage.getByRole('heading', { name: heading.text, exact: true });
      const actual = await locator.evaluate(rect);
      const errors = Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number((actual[key] - heading[key]).toFixed(3))]));
      report.geometry.headings.push({ text: heading.text, actual, expected: heading, errors });
      if (Object.values(errors).some((error) => Math.abs(error) > 1)) failures.push({ text: heading.text, errors });
      if (!actual.fontFamily.includes('Nunito Sans') || actual.fontSize !== '64px') failures.push({ text: heading.text, fontFamily: actual.fontFamily, fontSize: actual.fontSize });
    }
    expect(failures, 'Heading box differences from the source frame').toEqual([]);
    return { count: report.geometry.headings.length, tolerance: '1 CSS px' };
  });
  await check('Exported Figma asset geometry at1600', async () => {
    const failures = [];
    report.geometry.assets = [];
    // knot-mark is a nested child of wordmark; its metadata x/y are local.
    for (const asset of assets.filter((item) => item.name !== 'knot-mark')) {
      const byData = sourcePage.locator(`[data-design-asset="${asset.name}"]`);
      const byImage = sourcePage.locator(`img[src$="/${asset.svg}"], img[src$="/${asset.png2x}"]`);
      const locator = await byData.count() ? byData.first() : byImage.first();
      if (!await locator.count()) { failures.push({ name: asset.name, error: 'Source asset missing from DOM' }); continue; }
      const actual = await locator.evaluate(rect);
      const expected = expectedAssetRect(asset);
      const errors = Object.fromEntries(['x', 'y', 'width', 'height'].map((key) => [key, Number((actual[key] - expected[key]).toFixed(3))]));
      report.geometry.assets.push({ name: asset.name, actual, expected, errors });
      if (Object.values(errors).some((error) => Math.abs(error) > 1)) failures.push({ name: asset.name, errors });
    }
    expect(failures, 'Asset differences from the Figma transform origins and bounds').toEqual([]);
    return { count: report.geometry.assets.length, tolerance: '1 CSS px' };
  });
  await check('Source images load successfully', async () => {
    const broken = await sourcePage.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
    expect(broken).toEqual([]);
    return { count: await sourcePage.locator('img').count() };
  });

  let reference;
  for (const candidate of [process.env.REFERENCE_IMAGE, 'inspection/exact-reference.png', 'inspection/qa-reference-local-1600.png'].filter(Boolean)) {
    try { if ((await stat(candidate)).size > 0) { reference = candidate; break; } } catch { /* Optional external reference is not ready yet. */ }
  }
  if (reference) {
    await check('Compare full source frame raster', async () => {
      const sourceData = `data:image/png;base64,${(await readFile(sourceCapture)).toString('base64')}`;
      const referenceData = `data:image/png;base64,${(await readFile(reference)).toString('base64')}`;
      const comparison = await sourcePage.evaluate(async ({ sourceData, referenceData }) => {
        const load = (url) => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url; });
        const [actual, reference] = await Promise.all([load(sourceData), load(referenceData)]);
        if (actual.naturalWidth !== reference.naturalWidth || actual.naturalHeight !== reference.naturalHeight) return { comparable: false, actual: [actual.naturalWidth, actual.naturalHeight], reference: [reference.naturalWidth, reference.naturalHeight] };
        const width = actual.naturalWidth, height = actual.naturalHeight;
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(actual, 0, 0); const a = context.getImageData(0, 0, width, height);
        context.clearRect(0, 0, width, height); context.drawImage(reference, 0, 0); const b = context.getImageData(0, 0, width, height);
        const diff = context.createImageData(width, height);
        const bands = Array.from({ length: Math.ceil(height / 400) }, (_, index) => ({ y: index * 400, pixels: 0, differing: 0, absoluteError: 0 }));
        let differing = 0, absoluteError = 0;
        for (let offset = 0; offset < a.data.length; offset += 4) {
          const delta = [0, 1, 2].map((channel) => Math.abs(a.data[offset + channel] - b.data[offset + channel]));
          const error = delta.reduce((sum, value) => sum + value, 0);
          const changed = Math.max(...delta) > 24;
          const band = bands[Math.floor(Math.floor(offset / 4 / width) / 400)];
          band.pixels++; band.absoluteError += error; absoluteError += error;
          if (changed) { differing++; band.differing++; }
          diff.data[offset] = changed ? 255 : 255 - Math.round(error / 6);
          diff.data[offset + 1] = changed ? 45 : 255 - Math.round(error / 6);
          diff.data[offset + 2] = changed ? 80 : 255 - Math.round(error / 6);
          diff.data[offset + 3] = 255;
        }
        context.putImageData(diff, 0, 0);
        return { comparable: true, width, height, differingPixelPercent: 100 * differing / (width * height), meanAbsoluteChannelError: absoluteError / (width * height * 3), bands: bands.map((band) => ({ y: band.y, differingPixelPercent: 100 * band.differing / band.pixels, meanAbsoluteChannelError: band.absoluteError / (band.pixels * 3) })), differencePNG: canvas.toDataURL('image/png').split(',')[1] };
      }, { sourceData, referenceData });
      if (comparison.differencePNG) { await writeFile(`${artifactDirectory}/1600-reference-difference.png`, Buffer.from(comparison.differencePNG, 'base64')); delete comparison.differencePNG; }
      report.visualComparison = { reference, ...comparison };
      // The local renderer approximates certain effects; metrics are evidence,
      // not a claim that this renderer is an authoritative Figma screenshot.
      expect(comparison.comparable, 'Reference and implementation raster dimensions').toBeTruthy();
      return report.visualComparison;
    });
  } else report.visualComparison = { skipped: 'No nonempty1600×4824 reference raster exists yet.' };

  await check('Claim validation, editor persistence and HTML export', async () => {
    const form = sourcePage.locator('form').filter({ has: sourcePage.getByRole('button', { name: /^Claim your knot\.site$/i }) }).first();
    const username = form.locator('input').first();
    await username.fill('!');
    await form.getByRole('button', { name: /^Claim your knot\.site$/i }).click();
    await expect(username).toHaveAttribute('aria-invalid', 'true');
    await expect(sourcePage.getByRole('alert').first()).toBeVisible();
    await username.fill('exact-studio');
    await form.getByRole('button', { name: /^Claim your knot\.site$/i }).click();
    const editor = sourcePage.getByRole('dialog').last();
    await expect(editor).toBeVisible();
    await editor.getByRole('textbox', { name: 'Your name', exact: true }).fill('Exact Studio');
    await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(editor.getByRole('status')).toContainText('Draft saved');
    const downloading = sourcePage.waitForEvent('download');
    await editor.getByRole('button', { name: 'Export HTML', exact: true }).click();
    const download = await downloading;
    const exportPath = `${artifactDirectory}/${download.suggestedFilename()}`;
    await download.saveAs(exportPath);
    expect(await readFile(exportPath, 'utf8')).toContain('Exact Studio');
    await closeEditor(sourcePage);
    await sourcePage.getByRole('button', { name: /^Log\s?In$/i }).click();
    const login = sourcePage.getByRole('dialog').last();
    await login.getByRole('textbox', { name: /Draft username/i }).fill('exact-studio');
    await login.getByRole('button', { name: /Open my workspace/i }).click();
    await expect(sourcePage.getByRole('dialog').last().getByRole('textbox', { name: 'Your name', exact: true })).toHaveValue('Exact Studio');
    await closeEditor(sourcePage);
    return { exportPath, restoredName: 'Exact Studio' };
  });
  await sourcePage.close();

  for (const width of [1440, 1024, 768, 390, 320]) {
    const mobile = width < 600;
    const compact = width < 1200;
    const page = await browser.newPage({ viewport: { width, height: mobile ? 844 : 1000 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1, reducedMotion: width === 320 ? 'reduce' : 'no-preference' });
    observe(page, String(width));
    page.setDefaultTimeout(10000);
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await settle(page, true);
    await capture(page, `${width}-full`);
    await capture(page, `${width}-top`, false);
    await check(`${width}px responsive bounds and headings`, async () => {
      const size = await dimensions(page); report.viewports[width] = size;
      expect(size.width).toBeLessThanOrEqual(width + 1);
      for (const heading of headings) await expect(page.getByRole('heading', { name: heading.text, exact: true })).toBeVisible();
      return size;
    });
    if (compact) {
      await check(`${width}px mobile navigation and editor access`, async () => {
        const menu = page.locator('button[aria-controls="ks-mobile-navigation"]');
        await menu.click();
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
        const navigation = page.getByRole('navigation', { name: /Mobile navigation/i });
        await expect(navigation).toBeVisible();
        await expect(navigation.getByRole('button', { name: /Blog/i })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(navigation).not.toBeVisible();
        await expect(menu).toBeFocused();
        const form = page.locator('form').filter({ has: page.getByRole('button', { name: /^Claim your knot\.site$/i }) }).first();
        await form.locator('input').first().fill(`mobile-${width}`);
        await form.getByRole('button', { name: /^Claim your knot\.site$/i }).click();
        await expect(page.getByRole('dialog').last().getByRole('textbox', { name: 'Your name', exact: true })).toBeVisible();
        await closeEditor(page);
      });
    }
    await page.close();
  }

  const keyboard = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  observe(keyboard, 'keyboard-reduced');
  await keyboard.goto(baseURL, { waitUntil: 'networkidle' });
  await settle(keyboard);
  await check('Reduced motion keyboard navigation and editor focus', async () => {
    await keyboard.keyboard.press('Tab');
    await expect(keyboard.getByRole('link', { name: /Skip to content/i })).toBeFocused();
    const form = keyboard.locator('form').filter({ has: keyboard.getByRole('button', { name: /^Claim your knot\.site$/i }) }).first();
    const input = form.locator('input').first();
    await input.focus(); await input.fill('keyboard-studio'); await keyboard.keyboard.press('Enter');
    const editor = keyboard.getByRole('dialog').last(); await expect(editor).toBeVisible();
    await expect(editor.getByRole('textbox', { name: 'Your name', exact: true })).toBeVisible();
    expect(await editor.evaluate((element) => element.contains(document.activeElement) && !!document.activeElement.getClientRects().length)).toBeTruthy();
    await keyboard.keyboard.press('Escape'); await expect(editor).not.toBeVisible();
    await expect(input).toBeFocused();
    return { reducedMotion: true, keyboardClaim: true, modalFocusRestored: true };
  });
  await capture(keyboard, '1440-reduced-motion', false);
  await keyboard.close();
} catch (error) {
  report.checks.push({ name: 'Uncaught QA execution failure', pass: false, error: error.message });
  console.error(error);
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  report.summary = { passed: report.checks.filter((item) => item.pass).length, failed: report.checks.filter((item) => !item.pass).length, consoleErrors: report.consoleErrors.length, pageErrors: report.pageErrors.length, failedRequests: report.failedRequests.length, badResponses: report.badResponses.length };
  await writeFile(`${artifactDirectory}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.summary.failed || report.summary.pageErrors || report.summary.badResponses) process.exitCode = 1;
}
