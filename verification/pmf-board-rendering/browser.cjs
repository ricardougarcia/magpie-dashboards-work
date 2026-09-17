/* eslint-disable @typescript-eslint/no-require-imports -- Standalone read-only browser verification. */
/* BOARD_BASE_URL=http://127.0.0.1:3087 BOARD_OUTPUT_DIR=/absolute/output
 * BOARD_STORAGE_STATE=/path/auth.json BOARD_VIEWPORTS=1440,390 node verification/pmf-board-rendering/browser.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/ricardogarcia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = (process.env.BOARD_BASE_URL || 'http://127.0.0.1:3087').replace(/\/$/, '');
const output = process.env.BOARD_OUTPUT_DIR || path.join(__dirname, 'evidence');
const supported = [{ width: 1440, height: 1000 }, { width: 820, height: 1180 }, { width: 390, height: 844, touch: true }, { width: 320, height: 700, touch: true }];
const requested = process.env.BOARD_VIEWPORTS?.split(',').map(value => Number(value.trim()));
if (requested?.some(width => !supported.some(device => device.width === width))) throw new Error('BOARD_VIEWPORTS must list supported widths: 1440,820,390,320.');
const devices = supported.filter(device => !requested || requested.includes(device.width));
const expectedImages = ['/portfolio/pmf/prototypes/segmentation-selected.jpg', '/portfolio/pmf/market-overview.png'];
const expectedRegions = ['region-magpie', 'region-marketplace', 'region-gcm', 'region-lti', 'region-partner-portal', 'region-learnplatform-ccp'];
const results = [], runtime = [], screenshots = [];
let current = '';
fs.mkdirSync(output, { recursive: true });

function record(name, pass, detail) {
  const result = { viewport: current, name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) };
  results.push(result);
  if (!pass) console.log(JSON.stringify(result));
}
async function check(name, operation) {
  try { const value = await operation(); record(name, value === true || value?.pass, value?.detail); }
  catch (error) { record(name, false, error.message); }
}
const settle = page => page.waitForTimeout(820);
const overflow = page => page.evaluate(() => ({ pass: document.documentElement.scrollWidth <= innerWidth + 1, detail: { width: innerWidth, content: document.documentElement.scrollWidth } }));
const transforms = preview => preview.evaluate(element => [...element.querySelectorAll('*')].map(node => getComputedStyle(node).transform));
const tracksComplete = preview => preview.locator('svg path[pathLength="1"]').evaluateAll(paths => paths.length === 2 && paths.every(path => Number.parseFloat(getComputedStyle(path).strokeDashoffset) === 0));
const connected = (field, origin) => field.evaluate((element, expected) => element.dataset.gcmConnected === 'true' && element.dataset.gcmOrigin === expected, origin);
async function clearInteraction(page) {
  await page.evaluate(() => document.activeElement?.blur());
  await page.mouse.move(1, 1);
  await page.keyboard.press('Escape');
  await settle(page);
}
async function screenshot(page, name, locator) {
  const file = path.join(output, `${current}-${name}.png`);
  if (locator) await locator.screenshot({ path: file }); else await page.screenshot({ path: file });
  screenshots.push(file);
}
const settleScroll = page => page.evaluate(() => new Promise(resolve => {
  let previous = scrollY, stable = 0;
  const started = performance.now();
  const frame = () => {
    stable = Math.abs(scrollY - previous) < .1 ? stable + 1 : 0;
    previous = scrollY;
    if (stable >= 6 || performance.now() - started > 3000) resolve(); else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}));

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    for (const device of devices) {
      current = `${device.width}x${device.height}`;
      const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, deviceScaleFactor: 1, isMobile: Boolean(device.touch), hasTouch: Boolean(device.touch), reducedMotion: 'no-preference', ...(process.env.BOARD_STORAGE_STATE ? { storageState: process.env.BOARD_STORAGE_STATE } : {}) });
      const page = await context.newPage();
      const pageErrors = [], consoleErrors = [], transitionInterruptions = [];
      page.on('pageerror', error => {
        if (error.message === 'Transition was skipped') transitionInterruptions.push({ message: error.message, name: error.name });
        else pageErrors.push(error.message);
      });
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
      try {
        const response = await page.goto(`${base}/drawer`, { waitUntil: 'networkidle', timeout: 45000 });
        await page.evaluate(() => document.fonts.ready);
        record('Board returns HTTP 200', response.status() === 200, response.status());
        const slip = page.locator('[data-gcm-entry="pmf"]');
        const preview = page.locator('[data-pmf-board-preview]');
        const field = page.locator('[data-gcm-connected]');
        const pmfTitle = slip.locator('h2 a');
        const pmfRelated = slip.getByRole('button', { name: 'Related MVP [03.A]', exact: true });
        await preview.waitFor({ state: 'visible', timeout: 10000 });
        await slip.scrollIntoViewIfNeeded();
        await settle(page);

        await check('Six authored regions remain in order and PMF remains subentry 03.B', () => page.evaluate(expected => {
          const regions = [...document.querySelectorAll('[data-board-number]')].map(element => element.id);
          const slip = document.querySelector('[data-gcm-entry="pmf"]');
          const next = slip.nextElementSibling;
          return { pass: JSON.stringify(regions) === JSON.stringify(expected) && slip.dataset.boardSubentry === '03.B' && !slip.hasAttribute('data-board-number') && next?.id === 'region-learnplatform-ccp', detail: { regions, subentry: slip.dataset.boardSubentry, next: next?.id } };
        }, expectedRegions));
        await check('PMF retains its authored location above CCP and beside or below Partner Portal', () => slip.evaluate(element => {
          const box = element.getBoundingClientRect();
          const ccp = document.getElementById('region-learnplatform-ccp').getBoundingClientRect();
          const portal = document.getElementById('region-partner-portal').getBoundingClientRect();
          return { pass: box.bottom <= ccp.top + 1 && Math.abs(box.left - ccp.left) <= 1 && (innerWidth > 900 ? box.left > portal.right && Math.abs(box.top - portal.top) <= 1 : box.top >= portal.bottom - 1), detail: { pmf: { left: box.left, top: box.top, bottom: box.bottom }, ccp: { left: ccp.left, top: ccp.top }, portal: { right: portal.right, top: portal.top, bottom: portal.bottom } } };
        }));
        await check('PMF title, summary, and existing destinations stay intact', async () => (await pmfTitle.innerText()).replace(/\s+/g, ' ').trim() === 'Product Market Fit… with no product' && await pmfTitle.getAttribute('href') === '/work/pmf' && (await slip.innerText()).includes('Explore the need before defining the product.') && await slip.locator('footer a').getAttribute('href') === '/work/pmf');
        await check('Rendering is a named link to the PMF work sample', async () => await preview.evaluate(element => element.tagName === 'A' && element.getAttribute('href') === '/work/pmf') && (await preview.getAttribute('aria-label') || '').trim().length > 0);
        await check('Rendering loads only the two approved image pathnames', () => preview.evaluate((element, expected) => {
          const images = [...element.querySelectorAll('img')].map(image => ({ pathname: new URL(image.currentSrc || image.src).pathname, loaded: image.complete && image.naturalWidth > 0 }));
          return { pass: images.length === 2 && images.every((image, index) => image.pathname === expected[index] && image.loaded), detail: images };
        }, expectedImages));
        await check('Rendering presents both inquiry labels and MVP direction', () => preview.innerText().then(text => /User research/i.test(text) && /Market analysis/i.test(text) && /MVP direction/i.test(text)));
        await check('The two inquiry paths meet at the direction marker', () => preview.evaluate(element => {
          const paths = [...element.querySelectorAll('svg path[pathLength="1"]')];
          const marker = element.querySelector('svg rect');
          const target = { x: marker.x.baseVal.value + marker.width.baseVal.value / 2, y: marker.y.baseVal.value + marker.height.baseVal.value / 2 };
          const endpoints = paths.map(path => { const end = path.getPointAtLength(path.getTotalLength()); return { x: end.x, y: end.y }; });
          return { pass: endpoints.length === 2 && endpoints.every(end => Math.abs(end.x - target.x) < .1 && Math.abs(end.y - target.y) < .1), detail: { target, endpoints } };
        }));
        await check('No page overflow and the rendering stays inside the PMF card', async () => {
          const bounds = await preview.evaluate(element => { const box = element.getBoundingClientRect(), card = element.closest('[data-gcm-entry="pmf"]').getBoundingClientRect(); return { pass: box.left >= card.left && box.right <= card.right + 1 && box.width > 0, detail: { left: box.left, right: box.right, cardLeft: card.left, cardRight: card.right } }; });
          return { pass: (await overflow(page)).pass && bounds.pass, detail: bounds.detail };
        });

        await clearInteraction(page);
        const initialTransforms = await transforms(preview);
        if (!device.touch) {
          await preview.hover();
          await settle(page);
          const hoverTransforms = await transforms(preview);
          record('Mouse hover subtly changes the rendering sheets', JSON.stringify(hoverTransforms) !== JSON.stringify(initialTransforms), { before: initialTransforms, after: hoverTransforms });
          await check('Hover completes both inquiry paths', () => tracksComplete(preview));
          await check('Rendering hover preserves PMF-to-GCM relationship', () => connected(field, 'pmf'));
        }
        await clearInteraction(page);
        await pmfTitle.focus();
        await page.keyboard.press('Tab');
        await settle(page);
        await check('Keyboard Tab reaches the new rendering with a visible focus indicator', () => preview.evaluate(element => document.activeElement === element && element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none'));
        const focusTransforms = await transforms(preview);
        record('Keyboard focus changes the rendering sheets', JSON.stringify(focusTransforms) !== JSON.stringify(initialTransforms));
        await check('Keyboard focus completes both inquiry paths', () => tracksComplete(preview));
        await check('Keyboard preview focus preserves PMF-to-GCM relationship', () => connected(field, 'pmf'));

        const gcmTitle = page.locator('[data-gcm-entry="gcm"] h2 a');
        await gcmTitle.focus();
        await check('Existing GCM keyboard focus still reveals its discovery relationship', () => connected(field, 'gcm'));
        if (!device.touch) {
          await clearInteraction(page);
          await gcmTitle.hover();
          await check('Existing GCM hover still reveals its discovery relationship', () => connected(field, 'gcm'));
        }
        if (device.touch) await pmfRelated.tap(); else await pmfRelated.click();
        await page.evaluate(() => document.activeElement?.blur());
        await page.mouse.move(1, 1);
        await settle(page);
        await check('Relationship activation pins the PMF connection after exit', async () => await pmfRelated.getAttribute('aria-pressed') === 'true' && await connected(field, 'pmf'));
        await page.keyboard.press('Escape');
        await check('Escape dismisses the existing pinned relationship', async () => await pmfRelated.getAttribute('aria-pressed') === 'false' && await field.getAttribute('data-gcm-connected') === 'false');

        await page.emulateMedia({ reducedMotion: 'reduce' });
        await clearInteraction(page);
        await preview.scrollIntoViewIfNeeded();
        const reducedBefore = await transforms(preview);
        await check('Reduced motion displays both inquiry paths without interaction', () => tracksComplete(preview));
        await preview.focus();
        await settle(page);
        const reducedFocus = await transforms(preview);
        await check('Reduced motion keeps both sheets visible and static on focus', async () => ({ pass: JSON.stringify(reducedBefore) === JSON.stringify(reducedFocus) && await preview.locator('img').evaluateAll(images => images.every(image => { const style = getComputedStyle(image); const box = image.getBoundingClientRect(); return style.visibility === 'visible' && Number(style.opacity) > 0 && box.width > 0 && box.height > 0; })), detail: { before: reducedBefore, focused: reducedFocus } }));
        if (!device.touch) {
          await preview.hover();
          await settle(page);
          const reducedHover = await transforms(preview);
          record('Reduced motion also keeps sheets static on hover', JSON.stringify(reducedBefore) === JSON.stringify(reducedHover));
        }
        await clearInteraction(page);
        await slip.scrollIntoViewIfNeeded();
        await settle(page);
        await screenshot(page, 'pmf-card', slip);
        if ([1440, 390].includes(device.width)) await screenshot(page, 'board-context');

        await preview.focus();
        await settleScroll(page);
        const before = await preview.evaluate(element => ({ y: scrollY, top: element.getBoundingClientRect().top }));
        await page.keyboard.press('Enter');
        await page.waitForURL('**/work/pmf');
        await page.waitForLoadState('networkidle');
        await check('Rendering opens the PMF page by keyboard', async () => await page.locator('[data-pmf-page]').count() === 1 && await page.locator('[data-pmf-gallery="prototype"]').count() === 1);
        await page.goBack({ waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await settle(page);
        await settleScroll(page);
        await check('Browser Back restores the Board card framing', () => page.locator('[data-pmf-board-preview]').evaluate((element, before) => ({ pass: location.pathname === '/drawer' && Math.abs(scrollY - before.y) <= 8 && Math.abs(element.getBoundingClientRect().top - before.top) <= 8, detail: { before, after: { y: scrollY, top: element.getBoundingClientRect().top } } }), before));
        await check('No overflow after interaction and navigation', () => overflow(page));
      } catch (error) {
        record('Viewport flow completes', false, error.stack);
        try { await screenshot(page, 'failure'); } catch { /* Keep the original failure. */ }
      }
      record('No application runtime or console errors', pageErrors.length === 0 && consoleErrors.length === 0, { pageErrors, consoleErrors, transitionInterruptions });
      runtime.push({ viewport: current, pageErrors, consoleErrors, transitionInterruptions });
      await context.close();
    }
  } finally {
    await browser.close();
    const report = { base, timestamp: new Date().toISOString(), passed: results.filter(result => result.pass).length, failed: results.filter(result => !result.pass).length, results, runtime, screenshots };
    const reportPath = path.join(output, 'results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ base, passed: report.passed, failed: report.failed, screenshots: screenshots.length, report: reportPath }));
    if (report.failed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
