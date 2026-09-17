/* eslint-disable @typescript-eslint/no-require-imports -- Standalone local browser verification. */
/* Read-only gallery verification, including authenticated preview/UAT reuse:
 * PMF_BASE_URL=https://... PMF_OUTPUT_DIR=/absolute/output PMF_STORAGE_STATE=/path/state.json PMF_VIEWPORTS=1440,390 node verification/pmf-gallery/browser.cjs
 * Uses isolated browser contexts and never writes portfolio data.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/ricardogarcia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const base = (process.env.PMF_BASE_URL || 'http://127.0.0.1:3086').replace(/\/$/, '');
const output = process.env.PMF_OUTPUT_DIR || path.join(__dirname, 'local');
const storageState = process.env.PMF_STORAGE_STATE;
const supportedDevices = [
  { width: 1440, height: 1000 }, { width: 820, height: 1180 },
  { width: 390, height: 844, touch: true }, { width: 320, height: 700, touch: true },
];
const requestedWidths = process.env.PMF_VIEWPORTS?.split(',').map(value => Number(value.trim()));
if (requestedWidths?.some(width => !supportedDevices.some(device => device.width === width))) throw new Error('PMF_VIEWPORTS must list supported widths: 1440,820,390,320.');
const devices = supportedDevices.filter(device => !requestedWidths || requestedWidths.includes(device.width));
const labels = ['Prototype', 'Segment', 'Ask', 'Enrich'];
const sources = ['discovery-prototype.jpg', 'segmentation-selected.jpg', 'inference-response.jpg', 'imputation-progress.jpg'];
const titles = ['Population discovery prototype', 'Population segmentation prototype', 'Inference prototype', 'Data imputation prototype'];
const results = [], screenshots = [], runtime = [];
let current = '';
fs.mkdirSync(output, { recursive: true });

function record(name, pass, detail) {
  const result = { viewport: current, name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) };
  results.push(result);
  if (!pass) console.log(JSON.stringify(result));
}
async function check(name, operation) {
  try {
    const value = await operation();
    record(name, value === true || value?.pass, value?.detail);
  } catch (error) { record(name, false, error.message); }
}
const settle = page => page.waitForTimeout(450);
const instantScroll = (page, y) => page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
const overflow = page => page.evaluate(() => ({ pass: document.documentElement.scrollWidth <= innerWidth + 1, detail: { viewport: innerWidth, content: document.documentElement.scrollWidth } }));
async function screenshot(page, name, locator) {
  const file = path.join(output, `${current}-${name}.png`);
  if (locator) await locator.screenshot({ path: file });
  else await page.screenshot({ path: file });
  screenshots.push(file);
}
async function restored(page, trigger, previous) {
  // Native dialog.close() removes the open state before its queued close event
  // restores application scroll state. Wait for the observable lifecycle.
  await page.waitForFunction(({ id, previous }) => document.activeElement === document.getElementById(id) && document.body.style.overflow === previous.body && document.documentElement.style.overflow === previous.root, { id: await trigger.getAttribute('id'), previous }, { timeout: 2500 });
  return true;
}
async function selected(gallery, index) {
  return gallery.evaluate((element, expected) => {
    const buttons = [...element.querySelectorAll('[role="group"] button')];
    const trigger = element.querySelector('button[aria-haspopup="dialog"]');
    const images = [...trigger.querySelectorAll('img')];
    const visible = images.filter(image => image.getAttribute('aria-hidden') !== 'true');
    const captions = [...element.querySelector('figcaption').querySelectorAll('[data-active]')];
    const caption = captions.filter(node => getComputedStyle(node).visibility === 'visible' && node.getAttribute('aria-hidden') !== 'true');
    return {
      pass: buttons.length === 4 && buttons.every((button, position) => button.getAttribute('aria-pressed') === String(position === expected.index)) &&
        visible.length === 1 && visible[0].src.endsWith(expected.source) && visible[0].alt.length > 0 && visible[0].complete && visible[0].naturalWidth === 960 &&
        trigger.getAttribute('aria-label') === `View image: ${expected.title}` && caption.length === 1 && captions[expected.index] === caption[0],
      detail: { pressed: buttons.map(button => button.getAttribute('aria-pressed')), images: visible.map(image => ({ src: image.getAttribute('src'), alt: image.alt, naturalWidth: image.naturalWidth })), caption: caption.map(node => node.textContent) },
    };
  }, { index, source: sources[index], title: titles[index] });
}
const geometry = gallery => gallery.evaluate(element => {
  const trigger = element.querySelector('button[aria-haspopup="dialog"]');
  const pane = trigger.querySelector('img').parentElement.getBoundingClientRect();
  const caption = element.querySelector('figcaption').getBoundingClientRect();
  const figure = element.getBoundingClientRect();
  return { pane: pane.height, caption: caption.height, figure: figure.height, width: pane.width };
});
const readProgress = page => page.evaluate(() => ({
  rails: [...document.querySelectorAll('[data-pmf-track]')].map(element => Number(element.style.getPropertyValue('--pmf-line-progress'))),
  join: Number(document.querySelector('[data-pmf-convergence]').style.getPropertyValue('--pmf-join')),
  arrived: document.querySelector('[data-pmf-convergence]').dataset.arrived,
}));

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    for (const device of devices) {
      current = `${device.width}x${device.height}`;
      const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, isMobile: Boolean(device.touch), hasTouch: Boolean(device.touch), deviceScaleFactor: 1, reducedMotion: 'no-preference', ...(storageState ? { storageState } : {}) });
      const page = await context.newPage();
      const pageErrors = [], consoleErrors = [], failedImages = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
      page.on('response', response => { if (response.url().includes('/portfolio/pmf/') && response.status() >= 400) failedImages.push({ url: response.url(), status: response.status() }); });
      try {
        const response = await page.goto(`${base}/work/pmf`, { waitUntil: 'networkidle', timeout: 45000 });
        await page.evaluate(() => document.fonts.ready);
        await settle(page);
        record('PMF page returns 200', response.status() === 200, response.status());
        const gallery = page.locator('[data-pmf-gallery="prototype"]');
        await gallery.waitFor({ state: 'visible', timeout: 10000 });
        const selectors = gallery.getByRole('group', { name: 'Prototype views' });
        const buttons = labels.map(name => selectors.getByRole('button', { name, exact: true }));
        const trigger = gallery.locator('button[aria-haspopup="dialog"]');
        await gallery.scrollIntoViewIfNeeded();
        await settle(page);
        await check('Initial frame has a single accessible image and caption', () => selected(gallery, 0));
        await check('No initial horizontal overflow or framework error overlay', async () => (await overflow(page)).pass && await page.locator('[data-nextjs-dialog], .vite-error-overlay').count() === 0);
        await check('Gallery disclosure identifies original prototype frames', () => gallery.locator('figcaption').innerText().then(text => text.includes('Original prototype frame') && !text.includes('withheld')));
        await check('Selector targets remain within the gallery and at least 44px high', () => selectors.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          const sizes = [...element.querySelectorAll('button')].map(button => { const box = button.getBoundingClientRect(); return { left: box.left, right: box.right, width: box.width, height: box.height }; });
          return { pass: sizes.every(size => size.height >= 44 && size.left >= bounds.left - 1 && size.right <= bounds.right + 1), detail: sizes };
        }));

        const dimensions = [];
        for (let index = 0; index < buttons.length; index++) {
          if (device.touch) await buttons[index].tap(); else await buttons[index].hover();
          await settle(page);
          await check(`${labels[index]}: ${device.touch ? 'tap' : 'mouse hover'} selects correct frame`, () => selected(gallery, index));
          dimensions.push(await geometry(gallery));
          if (!device.touch) {
            await page.mouse.move(1, 1);
            await check(`${labels[index]}: pointer exit retains selection`, () => selected(gallery, index));
          }
        }
        record('Pane and caption heights remain stable across all four frames', dimensions.every(item => ['pane', 'caption', 'figure'].every(key => Math.abs(item[key] - dimensions[0][key]) <= 1)), dimensions);
        await screenshot(page, 'gallery', gallery);

        await buttons[1].focus();
        await check('Keyboard focus selects Segment', () => selected(gallery, 1));
        for (const [key, index] of [['ArrowRight', 2], ['End', 3], ['Home', 0], ['ArrowLeft', 3]]) {
          await page.keyboard.press(key);
          await check(`${key} moves selector focus and selection together`, async () => ({ pass: (await selected(gallery, index)).pass && await buttons[index].evaluate(element => document.activeElement === element) }));
        }

        await buttons[1].focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Shift+Tab');
        await check('Shift+Tab returns directly from selected Ask to its image button', async () => ({ pass: (await selected(gallery, 2)).pass && await trigger.evaluate(element => document.activeElement === element) }));
        const keyboardOverflow = await page.evaluate(() => ({ body: document.body.style.overflow, root: document.documentElement.style.overflow }));
        await page.keyboard.press('Enter');
        const keyboardDialog = gallery.getByRole('dialog', { name: titles[2] });
        await check('Enter opens the keyboard-selected Ask frame', async () => {
          await keyboardDialog.waitFor({ state: 'visible', timeout: 2500 });
          return await keyboardDialog.getByRole('img').getAttribute('src') === `/portfolio/pmf/prototypes/${sources[2]}`;
        });
        await page.keyboard.press('Escape');
        await restored(page, trigger, keyboardOverflow);

        for (let index = 0; index < buttons.length; index++) {
          if (device.touch) await buttons[index].tap(); else await buttons[index].click();
          await settle(page);
          const before = await page.evaluate(() => ({ body: document.body.style.overflow, root: document.documentElement.style.overflow }));
          if (device.touch) await trigger.tap(); else await trigger.click();
          const dialog = gallery.getByRole('dialog', { name: titles[index] });
          await dialog.waitFor({ state: 'visible' });
          await check(`${labels[index]}: dialog shows original selected image with accurate disclosure`, async () => {
            const image = dialog.getByRole('img');
            return await image.getAttribute('src') === `/portfolio/pmf/prototypes/${sources[index]}` && await image.evaluate(element => element.complete && element.naturalWidth === 960) && await dialog.getByText('Original prototype frame', { exact: true }).isVisible() && !(await dialog.innerText()).includes('withheld');
          });
          await check(`${labels[index]}: native modal focuses Close and locks body and root`, async () => ({ pass: await dialog.getByRole('button', { name: 'Close', exact: true }).evaluate(element => document.activeElement === element) && await page.evaluate(() => document.body.style.overflow === 'hidden' && document.documentElement.style.overflow === 'hidden') }));
          await check(`${labels[index]}: dialog fits the viewport`, () => dialog.evaluate(element => { const box = element.getBoundingClientRect(); return { pass: box.left >= 0 && box.right <= innerWidth + 1 && box.top >= 0 && box.bottom <= innerHeight + 1, detail: { x: box.x, y: box.y, width: box.width, height: box.height } }; }));
          await page.keyboard.press('Tab');
          await check(`${labels[index]}: Tab retains focus in modal`, () => dialog.getByRole('button', { name: 'Close', exact: true }).evaluate(element => document.activeElement === element));
          if (index === 2) await screenshot(page, 'modal');
          await page.keyboard.press('Escape');
          await dialog.waitFor({ state: 'hidden' });
          await check(`${labels[index]}: Escape restores focus and scroll state without changing selection`, async () => {
            await restored(page, trigger, before);
            return selected(gallery, index);
          });
        }

        await buttons[0].click();
        await settle(page);
        await check('Opacity crossfade has an intermediate state and completes after 320ms', () => gallery.evaluate(async element => {
          const buttons = [...element.querySelectorAll('[role="group"] button')];
          const images = [...element.querySelector('button[aria-haspopup="dialog"]').querySelectorAll('img')];
          const opacity = () => images.map(image => Number(getComputedStyle(image).opacity));
          const style = getComputedStyle(images[1]);
          const properties = style.transitionProperty.split(',').map(value => value.trim());
          const duration = style.transitionDuration.split(',').map(value => parseFloat(value));
          const declared = duration[properties.indexOf('opacity')];
          const before = opacity();
          buttons[1].click();
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          await new Promise(resolve => setTimeout(resolve, 80));
          const middle = opacity();
          await new Promise(resolve => setTimeout(resolve, 320));
          const after = opacity();
          return { pass: declared === .32 && before[0] === 1 && before[1] === 0 && middle[0] > 0 && middle[0] < 1 && middle[1] > 0 && middle[1] < 1 && after[0] === 0 && after[1] === 1, detail: { declared, before, middle, after } };
        }));
        await check('Fast successive selections settle on the final frame without mixed opacity', () => gallery.evaluate(async element => {
          const buttons = [...element.querySelectorAll('[role="group"] button')];
          const images = [...element.querySelector('button[aria-haspopup="dialog"]').querySelectorAll('img')];
          for (const index of [0, 2, 1, 3]) { buttons[index].click(); await new Promise(resolve => setTimeout(resolve, 45)); }
          await new Promise(resolve => setTimeout(resolve, 360));
          const values = images.map(image => Number(getComputedStyle(image).opacity));
          return { pass: values.every((value, index) => value === (index === 3 ? 1 : 0)) && buttons[3].getAttribute('aria-pressed') === 'true', detail: values };
        }));

        const protectedTrigger = page.getByRole('button', { name: 'View overview: Interview script', exact: true });
        await protectedTrigger.scrollIntoViewIfNeeded();
        if (device.touch) await protectedTrigger.tap(); else await protectedTrigger.click();
        const protectedDialog = page.getByRole('dialog', { name: 'Interview script', exact: true });
        await protectedDialog.waitFor({ state: 'visible' });
        await check('Existing interview viewer retains protected asset and disclosure', async () => await protectedDialog.getByRole('img').getAttribute('src') === '/portfolio/pmf/interview-overview.png' && await protectedDialog.getByText('Original artifact · details withheld', { exact: true }).isVisible());
        await page.keyboard.press('Escape');
        await protectedDialog.waitFor({ state: 'hidden' });
        await check('Existing viewer restores trigger focus', () => protectedTrigger.evaluate(element => document.activeElement === element));

        await page.evaluate(() => document.activeElement?.blur());
        await page.mouse.move(1, 1);
        await settle(page);
        await instantScroll(page, 0);
        await settle(page);
        const start = await readProgress(page);
        await instantScroll(page, await page.evaluate(() => document.documentElement.scrollHeight));
        await settle(page);
        const end = await readProgress(page);
        record('Native scroll advances both rails and completes convergence', end.rails.every((value, index) => value > start.rails[index]) && end.join >= .999 && end.arrived === 'true', { start, end });
        await screenshot(page, 'convergence');
        await instantScroll(page, 0);
        await settle(page);
        const reverse = await readProgress(page);
        record('Reverse scroll restores rail and convergence progress', reverse.join < .01 && reverse.rails.every((value, index) => Math.abs(value - start.rails[index]) < .02), { start, reverse });

        await page.emulateMedia({ reducedMotion: 'reduce' });
        await gallery.scrollIntoViewIfNeeded();
        await settle(page);
        await buttons[0].click();
        await check('Reduced motion swaps images immediately with no transitions', () => gallery.evaluate(element => {
          const images = [...element.querySelector('button[aria-haspopup="dialog"]').querySelectorAll('img')];
          const values = images.map(image => ({ opacity: Number(getComputedStyle(image).opacity), transition: getComputedStyle(image).transitionDuration }));
          return { pass: values.every((value, index) => value.transition === '0s' && value.opacity === (index === 0 ? 1 : 0)), detail: values };
        }));
        const reduced = await readProgress(page);
        record('Reduced motion keeps both rails and convergence complete', reduced.rails.every(value => value === 1) && reduced.join === 1, reduced);
        await check('No horizontal overflow after all gallery interactions', () => overflow(page));
        await check('All selected prototype assets load successfully', async () => ({ pass: failedImages.length === 0, detail: failedImages }));
      } catch (error) {
        record('Viewport flow completes', false, error.stack);
        try { await screenshot(page, 'failure'); } catch { /* Preserve the original failure. */ }
      }
      record('No browser runtime or console errors', pageErrors.length === 0 && consoleErrors.length === 0, { pageErrors, consoleErrors });
      runtime.push({ viewport: current, pageErrors, consoleErrors, failedImages });
      await context.close();
    }
  } finally {
    await browser.close();
    const report = { base, timestamp: new Date().toISOString(), passed: results.filter(item => item.pass).length, failed: results.filter(item => !item.pass).length, results, runtime, screenshots };
    const reportPath = path.join(output, 'results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ base, passed: report.passed, failed: report.failed, screenshots: screenshots.length, report: reportPath }));
    if (report.failed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
