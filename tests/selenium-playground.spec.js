const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://www.testmuai.com/selenium-playground/';
const MESSAGE = process.env.TEST_MESSAGE || 'Welcome to TestMu AI';
const SUCCESS_TEXT = 'Thanks for contacting us, we will get back to you shortly.';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
});

// Scripts on the demo pages attach handlers after load; wait so early clicks are not lost.
async function openDemo(page, name) {
  await page.getByRole('link', { name }).click();
  await page.waitForLoadState('networkidle');
}

// Reports pass/fail to the TestMu AI session so it is visible on the dashboard.
test.afterEach(async ({ page }, testInfo) => {
  if (!process.env.LT_USERNAME) return;
  const status = testInfo.status === testInfo.expectedStatus ? 'passed' : 'failed';
  const remark = testInfo.error ? testInfo.error.message.slice(0, 250) : 'OK';
  await page
    .evaluate(() => {}, `lambdatest_action: ${JSON.stringify({ action: 'setTestStatus', arguments: { status, remark } })}`)
    .catch(() => {});
});

test('Scenario 1: Simple Form Demo', async ({ page }) => {
  await openDemo(page, 'Simple Form Demo');
  await expect(page).toHaveURL(/simple-form-demo/);

  await page.getByPlaceholder('Please enter your Message').fill(MESSAGE);
  await page.getByRole('button', { name: 'Get Checked Value' }).click();

  await expect(page.locator('#message')).toHaveText(MESSAGE);
});

test('Scenario 2: Drag & Drop Sliders', async ({ page }) => {
  await openDemo(page, 'Drag & Drop Sliders');

  const target = 95;
  const slider = page.locator('xpath=//h4[normalize-space()="Default value 15"]/following::input[@type="range"][1]');
  const output = page.locator('xpath=//h4[normalize-space()="Default value 15"]/following::output[1]');
  await expect(slider).toBeVisible();

  const min = Number(await slider.getAttribute('min')) || 0;
  const max = Number(await slider.getAttribute('max')) || 100;
  const box = await slider.boundingBox();
  const y = box.y + box.height / 2;
  const x = box.x + (box.width * (target - min)) / (max - min);

  await page.mouse.move(box.x + (box.width * (15 - min)) / (max - min), y);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 20 });
  await page.mouse.up();

  // Fine-tune with the keyboard in case the drag lands a step off.
  for (let i = 0; i < 10 && Number(await slider.inputValue()) !== target; i++) {
    await slider.press(Number(await slider.inputValue()) < target ? 'ArrowRight' : 'ArrowLeft');
  }

  await expect(slider).toHaveValue(String(target));
  await expect(output).toHaveText(String(target));
});

test('Scenario 3: Input Form Submit', async ({ page }) => {
  await openDemo(page, 'Input Form Submit');

  await page.getByRole('button', { name: 'Submit' }).click();
  const nameField = page.getByPlaceholder('Name', { exact: true });
  const validationMessage = await nameField.evaluate((el) => el.validationMessage);
  expect(validationMessage).toMatch(/Please fill (in|out) this field\./);

  await nameField.fill('Gangirreddy');
  await page.locator('#inputEmail4').fill('gangirreddy@example.com');
  await page.getByPlaceholder('Password').fill('Passw0rd!23');
  await page.getByPlaceholder('Company').fill('TestMu AI');
  await page.getByPlaceholder('Website').fill('https://www.testmuai.com');
  await page.locator('select[name="country"]').selectOption({ label: 'United States' });
  await page.getByPlaceholder('City').fill('New York');
  await page.getByPlaceholder('Address 1').fill('123 Main Street');
  await page.getByPlaceholder('Address 2').fill('Suite 100');
  await page.getByPlaceholder('State').fill('NY');
  await page.getByPlaceholder('Zip Code').fill('10001');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText(SUCCESS_TEXT)).toBeVisible();
});
