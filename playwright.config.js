// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const LT_USERNAME = process.env.LT_USERNAME;
const LT_ACCESS_KEY = process.env.LT_ACCESS_KEY;
const BUILD_NAME = process.env.BUILD_NAME || 'Playwright102';
const runOnCloud = Boolean(LT_USERNAME && LT_ACCESS_KEY);

// Browser/OS combinations executed on the TestMu AI cloud.
const COMBINATIONS = {
  'chrome-win10': { browserName: 'pw-chromium', platform: 'Windows 10', device: devices['Desktop Chrome'] },
  'firefox-win11': { browserName: 'pw-firefox', platform: 'Windows 11', device: devices['Desktop Firefox'] },
};

/** Builds the TestMu AI CDP endpoint with network/video/console/screenshot capture enabled. */
function cloudOptions(projectName, { browserName, platform }) {
  const capabilities = {
    browserName,
    browserVersion: 'latest',
    'LT:Options': {
      platform,
      build: BUILD_NAME,
      project: 'Playwright102',
      name: `Playwright102 - ${projectName}`,
      user: LT_USERNAME,
      accessKey: LT_ACCESS_KEY,
      network: true,
      video: true,
      console: true,
      visual: true,
      geoLocation: 'IN',
      timezone: 'Kolkata',
      accessibility: true,
      'smartUI.project': 'Playwright102test',
    },
  };
  return {
    wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`,
  };
}

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: true,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: Object.entries(COMBINATIONS).map(([name, combo]) => ({
    name,
    use: {
      ...combo.device,
      ...(runOnCloud ? { connectOptions: cloudOptions(name, combo) } : {}),
    },
  })),
});
