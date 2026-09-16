/* eslint-disable @typescript-eslint/no-require-imports -- This local browser harness runs as CommonJS, outside the application bundle. */
/* Read-only browser verification. Reuse against an exact preview or stable UAT:
 * PMF_BASE_URL=https://... PMF_OUTPUT_DIR=/absolute/output node verification/pmf-two-lines/browser.cjs
 * Uses an isolated Chrome context; does not authenticate or mutate portfolio data.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/ricardogarcia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = (process.env.PMF_BASE_URL || 'http://127.0.0.1:3086').replace(/\/$/, '');
const output = process.env.PMF_OUTPUT_DIR || path.join(__dirname, 'local');
fs.mkdirSync(output, { recursive: true });
const results = [], runtime = [], screenshots = [], requests = [], nativeTransitionInterruptions = [];
let current = '';
const record = (name, pass, detail) => {
  const item = { viewport: current, name, pass: !!pass, ...(detail !== undefined ? { detail } : {}) };
  results.push(item); if (!pass) console.log(JSON.stringify(item));
};
const check = async (name, fn) => { try { const value = await fn(); record(name, value === true || value?.pass, value?.detail); } catch (error) { record(name, false, error.message); } };
const settle = page => page.waitForTimeout(450);
const settleScroll = page => page.evaluate(() => new Promise(resolve => {
  let previous = scrollY, stableFrames = 0;
  const start = performance.now();
  const frame = () => {
    stableFrames = Math.abs(scrollY - previous) < .1 ? stableFrames + 1 : 0;
    previous = scrollY;
    if (stableFrames >= 5 || performance.now() - start > 3000) resolve();
    else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}));
const instantScroll = (page, y) => page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
const snap = async (page, name, opts = {}) => { const file = path.join(output, `${name}.png`); await page.screenshot({ path: file, ...opts }); screenshots.push(file); };
const overflow = page => page.evaluate(() => ({ pass: document.documentElement.scrollWidth <= innerWidth + 1, detail: { viewport: innerWidth, content: document.documentElement.scrollWidth } }));
const active = locator => locator.getAttribute('aria-expanded').then(value => value === 'true');
const stepIds = ['research-choice', 'research-instrument', 'research-synthesis', 'market-context', 'capabilities-in-context', 'opportunity-synthesis'];
const safeSources = ['/portfolio/pmf/segmentation-overview.png', '/portfolio/pmf/interview-overview.png', '/portfolio/pmf/research-matrix-overview.png', '/portfolio/pmf/market-overview.png'];
const devices = [
  { width: 1440, height: 1000 }, { width: 1280, height: 800 }, { width: 820, height: 1180 },
  { width: 390, height: 844, isMobile: true, hasTouch: true }, { width: 320, height: 700, isMobile: true, hasTouch: true },
];

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    for (const device of devices) {
      current = `${device.width}x${device.height}`;
      const label = current;
      const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, isMobile: !!device.isMobile, hasTouch: !!device.hasTouch, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const pageErrors = [], consoleErrors = [], pmfRequests = [];
      page.on('pageerror', error => {
        if (error.message === 'Transition was skipped') nativeTransitionInterruptions.push({ viewport: label, message: error.message, name: error.name, url: page.url(), stack: error.stack });
        else pageErrors.push(error.message);
      });
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
      page.on('request', request => { if (page.url().includes('/work/pmf')) pmfRequests.push(request.url()); });
      try {
        const response = await page.goto(`${base}/work/pmf`, { waitUntil: 'networkidle', timeout: 45000 });
        await page.evaluate(() => document.fonts.ready);
        await settle(page);
        record('PMF route returns 200', response.status() === 200, response.status());
        await check('Semantic title and six checkpoints render', async () => await page.locator('h1').innerText() === 'Product–market fit\n…with no product.' && await page.locator('[data-pmf-checkpoint]').count() === 6);
        await check('Portfolio fonts loaded', () => page.locator('h1').evaluate(el => ({ pass: /Geist/i.test(getComputedStyle(el).fontFamily) && document.fonts.status === 'loaded', detail: getComputedStyle(el).fontFamily })));
        await check('No horizontal overflow on arrival', () => overflow(page));
        await check('No framework error overlay', async () => await page.locator('[data-nextjs-dialog], .vite-error-overlay').count() === 0);
        await snap(page, `${label}-top`);

        for (const id of stepIds) {
          const section = page.locator(`#${id}`), toggle = section.locator('h3 button');
          await section.scrollIntoViewIfNeeded();
          await settle(page);
          if (device.hasTouch) await toggle.tap(); else await toggle.hover();
          await settle(page);
          await check(`${id}: ${device.hasTouch ? 'tap' : 'hover'} exposes reasoning`, () => active(toggle));
          await check(`${id}: reasoning is visible and fits`, () => section.evaluate(el => {
            const button = el.querySelector('h3 button');
            const detail = document.getElementById(button.getAttribute('aria-controls'));
            const box = detail.getBoundingClientRect();
            return { pass: detail.getAttribute('aria-hidden') === 'false' && box.height > 20 && box.right <= innerWidth + 1, detail: { height: box.height, right: box.right } };
          }));
          await snap(page, `${label}-${id}`);
          // Escape is scoped to the checkpoint receiving keyboard focus.
          await toggle.focus(); await page.keyboard.press('Escape');
          await check(`${id}: Escape closes reasoning`, async () => !(await active(toggle)));
          await page.mouse.move(0, 0);
          await toggle.focus();
          // Focusing an already focused trigger does not fire a new focus event.
          await page.locator('h1').evaluate(el => { el.tabIndex = -1; el.focus({ preventScroll: true }); });
          await toggle.focus();
          await check(`${id}: keyboard focus exposes reasoning`, () => active(toggle));
          await toggle.click();
          await page.locator('h1').evaluate(el => el.focus({ preventScroll: true }));
          await page.mouse.move(0, 0);
          await check(`${id}: click pins reasoning after focus leaves`, () => active(toggle));
          await toggle.focus(); await page.keyboard.press('Escape');
        }

        await check('All four overview images loaded', () => page.locator('figure > button img').evaluateAll(images => ({ pass: images.length === 4 && images.every(img => img.complete && img.naturalWidth > 0), detail: images.map(img => ({ source: new URL(img.currentSrc).pathname, loaded: img.complete && img.naturalWidth > 0 })) })));
        await check('No source URLs in PMF markup', () => page.locator('[data-pmf-page]').evaluate(el => {
          const urls = [...el.querySelectorAll('a,img,source')].flatMap(node => ['href','src','srcset'].map(name => node.getAttribute(name)).filter(Boolean));
          const unsafe = urls.filter(url => /wixstatic|ricardougarcia\.com|pmf-market-analysis|concept-map\.png|synthesis\.png|findings\.jpg/.test(url));
          return { pass: unsafe.length === 0, detail: unsafe };
        }));
        const capabilities = page.locator('[data-pmf-capability-map] button');
        for (let index = 0; index < 4; index++) {
          const choice = capabilities.nth(index);
          if (device.hasTouch) await choice.tap(); else await choice.hover();
          await check(`Capability ${index + 1}: selected by ${device.hasTouch ? 'tap' : 'hover'}`, async () => await choice.getAttribute('aria-pressed') === 'true');
          await check(`Capability ${index + 1}: public research purpose shown`, () => choice.evaluate(el => document.getElementById(el.getAttribute('aria-controls')).innerText.trim().length > 25));
        }
        await snap(page, `${label}-capability-active`);

        const viewers = page.getByRole('button', { name: /^View overview:/ });
        for (let index = 0; index < 4; index++) {
          const trigger = viewers.nth(index);
          await trigger.scrollIntoViewIfNeeded(); await trigger.focus(); await settle(page);
          const before = await page.evaluate(() => ({ y: scrollY, overflow: document.body.style.overflow }));
          if (device.hasTouch) await trigger.tap(); else await trigger.click();
          await settle(page);
          // Moving a mouse onto a different checkpoint can close the previous
          // hover disclosure. Measure modal scroll locking after that transition.
          const openedY = await page.evaluate(() => scrollY);
          const dialog = page.locator('dialog[open]');
          await check(`Artifact ${index + 1}: opens accessible modal`, async () => await dialog.count() === 1 && await dialog.getAttribute('aria-labelledby') !== null);
          await check(`Artifact ${index + 1}: viewer uses safe direct source`, () => dialog.locator('img').evaluate((img, sources) => ({ pass: sources.includes(new URL(img.currentSrc).pathname) && img.complete && img.naturalWidth > 0, detail: new URL(img.currentSrc).pathname }), safeSources));
          await check(`Artifact ${index + 1}: modal contains forward and reverse focus`, async () => {
            await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
            const forward = await page.evaluate(() => !!document.activeElement.closest('dialog[open]'));
            await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
            return page.evaluate(forward => ({ pass: forward && !!document.activeElement.closest('dialog[open]'), detail: { forward, activeElement: document.activeElement.outerHTML.slice(0, 200) } }), forward);
          });
          await check(`Artifact ${index + 1}: constrained viewer geometry`, () => dialog.evaluate(el => {
            const box = el.getBoundingClientRect(), image = el.querySelector('img').getBoundingClientRect();
            return { pass: box.width <= innerWidth && box.height <= innerHeight && image.width <= box.width && image.height <= innerHeight * .63, detail: { modalWidth: box.width, modalHeight: box.height, imageWidth: image.width, imageHeight: image.height } };
          }));
          await page.mouse.wheel(0, 250); await page.waitForTimeout(120);
          await check(`Artifact ${index + 1}: background scrolling locked`, async () => await page.evaluate(y => ({ pass: Math.abs(scrollY - y) < 2 && document.body.style.overflow === 'hidden' && document.documentElement.style.overflow === 'hidden', detail: { modalScroll: y, currentScroll: scrollY, bodyOverflow: document.body.style.overflow, rootOverflow: document.documentElement.style.overflow } }), openedY));
          if (index === 1 || index === 3) await snap(page, `${label}-viewer-${index + 1}`);
          await page.keyboard.press('Escape'); await settle(page);
          await check(`Artifact ${index + 1}: Escape restores focus and body`, () => trigger.evaluate((el, previous) => ({ pass: !document.querySelector('dialog[open]') && document.activeElement === el && document.body.style.overflow === previous.overflow && Math.abs(scrollY - previous.openedY) < 2, detail: { focused: document.activeElement === el, overflow: document.body.style.overflow, scroll: scrollY, beforePointer: previous.y, modalScroll: previous.openedY } }), { ...before, openedY }));
          await page.keyboard.press('Escape');
        }

        await page.locator('h1').evaluate(el => el.focus({ preventScroll: true }));
        await page.mouse.move(0, 0); await instantScroll(page, 0); await settle(page);
        const readProgress = () => page.evaluate(() => ({ rails: [...document.querySelectorAll('[data-pmf-track]')].map(el => Number(el.style.getPropertyValue('--pmf-line-progress'))), join: Number(document.querySelector('[data-pmf-convergence]').style.getPropertyValue('--pmf-join')) }));
        const startProgress = await readProgress();
        await instantScroll(page, await page.evaluate(() => document.documentElement.scrollHeight)); await settle(page);
        const endProgress = await readProgress();
        await check('Native scroll draws rails and convergence forward', async () => ({ pass: endProgress.rails.every((value, index) => value > startProgress.rails[index]) && endProgress.join > .95, detail: { startProgress, endProgress } }));
        await check('Convergence heading and supporting copy align to the joined line', () => page.locator('[data-pmf-convergence]').evaluate(el => {
          const bounds = el.getBoundingClientRect(), center = bounds.left + bounds.width / 2;
          const heading = el.querySelector('h2').getBoundingClientRect();
          const copy = [...el.querySelectorAll('p')].find(node => node.textContent.startsWith('The combined work')).getBoundingClientRect();
          const headingCenter = heading.left + heading.width / 2, copyCenter = copy.left + copy.width / 2;
          return { pass: Math.abs(headingCenter - center) <= 2 && Math.abs(copyCenter - center) <= 2, detail: { center, headingCenter, copyCenter } };
        }));
        await snap(page, `${label}-convergence`);
        await instantScroll(page, 0); await settle(page);
        const reverseProgress = await readProgress();
        await check('Scroll progress reverses with native scroll', async () => ({ pass: reverseProgress.join < .05 && reverseProgress.rails.every((value, index) => Math.abs(value - startProgress.rails[index]) < .02), detail: reverseProgress }));
        await check('Convergence originates at rendered rails', () => page.evaluate(() => {
          const join = document.querySelector('[data-pmf-convergence]'), box = join.getBoundingClientRect();
          const tracks = [...document.querySelectorAll('[data-pmf-track]')];
          const origins = tracks.map(el => (el.getBoundingClientRect().left - box.left + parseFloat(getComputedStyle(el,'::before').left)) / box.width * 1000);
          const moves = [...join.querySelector('path').getAttribute('d').matchAll(/M([\d.]+)/g)].map(match => Number(match[1]));
          return { pass: innerWidth <= 760 ? Math.abs(moves[0] - origins[1]) < .1 : origins.every((value, index) => Math.abs(moves[index] - value) < .1), detail: { origins, moves } };
        }));
        await page.setViewportSize({ width: device.width + 17, height: device.height - 20 }); await settle(page);
        await check('Resize preserves page bounds', () => overflow(page));
        await page.setViewportSize({ width: device.width, height: device.height }); await settle(page);
        await page.emulateMedia({ reducedMotion: 'reduce' }); await settle(page);
        await check('Runtime reduced motion resolves rails and diagrams', () => page.evaluate(() => {
          const tracks = [...document.querySelectorAll('[data-pmf-track]')];
          const join = document.querySelector('[data-pmf-convergence]');
          const map = document.querySelector('[data-pmf-opportunity-map]');
          return { pass: tracks.every(el => el.style.getPropertyValue('--pmf-line-progress') === '1') && join.style.getPropertyValue('--pmf-join') === '1' && map.style.getPropertyValue('--pmf-map-progress') === '1', detail: { rails: tracks.map(el => el.style.getPropertyValue('--pmf-line-progress')), join: join.style.getPropertyValue('--pmf-join'), map: map.style.getPropertyValue('--pmf-map-progress') } };
        }));
        await snap(page, `${label}-full`, { fullPage: true });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        // A direct URL starts a document. Do not reuse in-flight disclosure
        // transitions and synthetic mouse hover from the preceding modal tests.
        await page.goto('about:blank');
        await page.goto(`${base}/work/pmf#market-context`, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); await settle(page); await settleScroll(page);
        await check('Direct checkpoint hash lands on correct content', () => page.locator('#market-context').evaluate(el => ({ pass: el.getBoundingClientRect().top >= -1 && el.getBoundingClientRect().top < innerHeight * .5, detail: el.getBoundingClientRect().top })));
        await check('No horizontal overflow after interactions', () => overflow(page));
        await check('No confidential original requests from PMF', async () => ({ pass: !pmfRequests.some(url => /wixstatic|pmf-market-analysis\.png/.test(url)), detail: pmfRequests.filter(url => /wixstatic|pmf-market-analysis\.png/.test(url)) }));
        requests.push(...pmfRequests);
      } catch (error) { record('Viewport flow completes', false, error.stack); }
      runtime.push({ viewport: label, pageErrors, consoleErrors });
      record('No browser runtime errors', pageErrors.length === 0 && consoleErrors.length === 0, { pageErrors, consoleErrors });
      await context.close();
    }

    current = 'entrypoints-and-boundaries';
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => {
      if (error.message === 'Transition was skipped') nativeTransitionInterruptions.push({ message: error.message, name: error.name, url: page.url(), stack: error.stack });
      else errors.push(error.message);
    });
    try {
      await page.goto(`${base}/drawer`, { waitUntil: 'networkidle', timeout: 45000 });
      const slip = page.locator('[data-gcm-entry="pmf"]');
      await slip.scrollIntoViewIfNeeded(); await settle(page);
      await check('Board has two local PMF entry links', () => slip.locator('a[href="/work/pmf"]').count().then(count => count === 2));
      await snap(page, 'board-pmf-entry');
      const boardY = await page.evaluate(() => scrollY);
      await slip.locator('h2 a').click(); await page.waitForURL('**/work/pmf'); await page.waitForLoadState('networkidle');
      await check('Board entry reaches the new PMF sample', async () => await page.locator('[data-pmf-page]').count() === 1);
      await check('Board position saved for PMF', () => page.evaluate(y => { const saved = JSON.parse(sessionStorage.getItem('portfolio-board-position')); return { pass: saved.project === '/work/pmf' && Math.abs(saved.y - y) < 5, detail: saved }; }, boardY));
      await page.locator('[data-board-return]').click(); await page.waitForURL('**/drawer'); await page.waitForLoadState('networkidle'); await settle(page); await settleScroll(page);
      await check('Return to Board restores framing', () => page.evaluate(y => ({ pass: Math.abs(scrollY - y) <= 8, detail: { expected: y, actual: scrollY, saved: sessionStorage.getItem('portfolio-board-position'), returning: sessionStorage.getItem('portfolio-return'), documentHeight: document.documentElement.scrollHeight, readyState: document.readyState } }), boardY));
      await page.goto(`${base}/work/gcm`, { waitUntil: 'networkidle' });
      await check('GCM opening and overlap hooks remain present', async () => await page.locator('[data-gcm-arrival]').count() === 1 && await page.locator('[data-gcm-content-sheet][data-gcm-sheet-ready="true"]').count() === 1 && await page.locator('[data-gcm-counter]').count() === 1);
      await check('GCM question retains its gradual animation contract', () => page.locator('[data-gcm-arrival] h1 > span').evaluate(el => { const css = getComputedStyle(el); return { pass: css.animationDuration === '1.8s' && css.animationDelay === '1.4s', detail: { duration: css.animationDuration, delay: css.animationDelay } }; }));
      await instantScroll(page, 220); await settle(page);
      await check('GCM intro still moves under the content sheet', () => page.locator('[data-gcm-arrival]').evaluate(el => ({ pass: parseFloat(el.style.getPropertyValue('--gcm-intro-offset')) > 0, detail: el.style.getPropertyValue('--gcm-intro-offset') })));
      const behavior = page.getByRole('button', { name: /Preserve conditions and filters/ }); await behavior.hover();
      await check('GCM behavior hover retains component highlights', async () => await page.locator('[data-gcm-selection="conditions"]').count() === 1 && await page.locator('[data-component="mcp"][data-active="true"]').count() === 1);
      await page.getByRole('button', { name: '02 / Integration', exact: true }).hover(); await page.waitForTimeout(200);
      await check('GCM product-work hover retains transition', async () => await page.locator('[data-gcm-evidence="integration"]').count() === 1);
      const companion = page.locator('[data-gcm-companion]'); await companion.scrollIntoViewIfNeeded(); await settle(page);
      await check('GCM companion links to PMF and uses protected thumbnail', () => companion.evaluate(el => { const link = el.querySelector('a'), image = el.querySelector('img'); return { pass: link.getAttribute('href') === '/work/pmf' && decodeURIComponent(image.currentSrc).includes('/portfolio/pmf/market-overview.png') && image.complete && image.naturalWidth > 0, detail: { href: link.getAttribute('href'), src: image.currentSrc } }; }));
      await check('GCM companion connector remains measured and animated', () => companion.evaluate(el => ({ pass: el.dataset.measured === 'true' && el.dataset.playing === 'true' && !!el.querySelector('svg path')?.getAttribute('d'), detail: { measured: el.dataset.measured, playing: el.dataset.playing } })));
      await snap(page, 'gcm-companion-safe-link');
      await companion.locator('a').click(); await page.waitForURL('**/work/pmf');
      await check('GCM companion opens the new sample', async () => await page.locator('[data-pmf-page]').count() === 1);
      const protectedResponse = await context.request.get(`${base}/api/timeline`);
      record('Timeline API remains unauthorized (GET only)', protectedResponse.status() === 401, protectedResponse.status());
      await page.goto(`${base}/edit`, { waitUntil: 'networkidle' });
      await check('Editor redirects to password login', async () => new URL(page.url()).pathname === '/edit/login' && await page.locator('input[type="password"]').count() === 1);
      const removed = await context.request.get(`${base}/portfolio/gcm/pmf-market-analysis.png`);
      record('Removed full-detail PMF asset is unavailable', removed.status() === 404 || removed.status() === 410, removed.status());
      record('Entry routes have no browser runtime errors', errors.length === 0, errors);
    } catch (error) { record('Entrypoint flow completes', false, error.stack); }
    await context.close();
  } finally {
    await browser.close();
    const report = { base, timestamp: new Date().toISOString(), passed: results.filter(item => item.pass).length, failed: results.filter(item => !item.pass).length, results, runtime, nativeTransitionInterruptions: { count: nativeTransitionInterruptions.length, entries: nativeTransitionInterruptions }, screenshots, pmfRequests: [...new Set(requests)] };
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ base, passed: report.passed, failed: report.failed, screenshots: screenshots.length, report: path.join(output, 'results.json') }));
    if (report.failed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
