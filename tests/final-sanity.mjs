import { chromium, expect } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const result = { checks: [], consoleErrors: [], pageErrors: [] };
page.on('console', (message) => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
page.on('pageerror', (error) => result.pageErrors.push(error.message));
try {
  await page.goto(process.env.BASE_URL || 'http://localhost:5173', { waitUntil: 'networkidle' });
  const gallery = page.getByRole('tab', { name: 'Gallery', exact: true });
  await gallery.click();
  await expect(gallery).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('A picture of your world.', { exact: true })).toBeVisible();
  result.checks.push('Section Gallery click and caption update pass after decorative ring fix.');
  await gallery.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Contact', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Contact', exact: true })).toHaveAttribute('aria-selected', 'true');
  result.checks.push('Section tab ArrowRight, Home and End keyboard navigation pass.');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Your Knot Site editor' });
  await expect(editor).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.getClientRects().length)).toBeTruthy();
  await editor.getByRole('button', { name: 'Close site editor', exact: true }).click();
  await expect(editor).not.toBeVisible();
  result.checks.push('Editor modal opens with visible initial focus and closes normally.');
  expect(await readFile('artifacts/qa-studio-portfolio.html', 'utf8')).toContain('QA Studio Test');
  result.checks.push('Previously downloaded HTML contains edited profile name.');
  result.pass = true;
} catch (error) {
  result.pass = false;
  result.error = error.message;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile('artifacts/final-sanity-report.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
