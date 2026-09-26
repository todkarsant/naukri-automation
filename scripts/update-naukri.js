const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const NAUKRI_LOGIN_URL = 'https://www.naukri.com/login';
const NAUKRI_PROFILE_URL = 'https://www.naukri.com/mnjuser/profile';
const EMAIL = process.env.NAUKRI_EMAIL;
const PASSWORD = process.env.NAUKRI_PASSWORD;

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  fs.appendFileSync(path.join(logsDir, 'naukri-update.log'), `[${timestamp}] ${message}\n`);
}

async function updateNaukriProfile() {
  log('Starting Naukri profile update...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // STEP 1: LOGIN - Naukri has 2 login page variants
    log('Going to Naukri login...');
    await page.goto(NAUKRI_LOGIN_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(logsDir, '01-login.png'), fullPage: true });
    
    log('Filling credentials...');
    
    // Variant 1: usernameField (most common)
    try {
      const usernameField = page.locator('#usernameField, input[name="USERNAME"], input[id="emailTxt"]');
      if (await usernameField.isVisible()) {
        await usernameField.fill(EMAIL);
        log('Filled email in usernameField');
      }
    } catch (e) {
      log('Variant 1 username field not found');
    }
    
    // Variant 2: Try generic text input if above fails
    try {
      const anyTextInput = page.locator('input[type="text"]').first();
      if (await anyTextInput.isVisible()) {
        const value = await anyTextInput.inputValue();
        if (!value) {
          await anyTextInput.fill(EMAIL);
          log('Filled email in first text input');
        }
      }
    } catch (e) {
      log('No text input found');
    }
    
    // Password field - common selectors
    try {
      const passwordField = page.locator('#pwd1, input[name="PASSWORD"], input[type="password"]').first();
      if (await passwordField.isVisible()) {
        await passwordField.fill(PASSWORD);
        log('Filled password');
      }
    } catch (e) {
      log('Password field not found');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(logsDir, '02-filled.png'), fullPage: true });
    
    // Click login button
    log('Clicking login...');
    try {
      const loginBtn = page.locator('button[type="submit"], input[type="submit"], .btn-primary, .login-btn').first();
      if (await loginBtn.isVisible()) {
        await loginBtn.click();
        log('Clicked login button');
      }
    } catch (e) {
      log('Login button click failed');
    }
    
    await page.waitForTimeout(15000);
    await page.screenshot({ path: path.join(logsDir, '03-after-login.png'), fullPage: true });
    
    // STEP 2: PROFILE
    log('Going to profile...');
    await page.goto(NAUKRI_PROFILE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(logsDir, '04-profile.png'), fullPage: true });
    
    // STEP 3: HEADLINE
    log('Updating headline...');
    try {
      const headlinesPath = path.join(__dirname, '..', 'cv-bank', 'headlines.txt');
      let headlines = ['Software Builder'];
      if (fs.existsSync(headlinesPath)) {
        headlines = fs.readFileSync(headlinesPath, 'utf-8').split('\n').filter(l => l.trim());
      }
      const headline = headlines[Math.floor(Math.random() * headlines.length)];
      log(`Selected: ${headline}`);
      
      // Look for headline input
      const headlineInput = page.locator('input[name*="headline" i], input[id*="headline" i], input[placeholder*="headline" i]').first();
      if (await headlineInput.isVisible()) {
        await headlineInput.fill(headline);
        log('Filled headline');
        
        // Click save
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update"), input[value="Save"], input[value="Update"]').first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          log('Saved headline');
          await page.waitForTimeout(3000);
        }
      } else {
        log('Headline input not found');
      }
    } catch (e) {
      log(`Headline error: ${e.message}`);
    }
    
    // STEP 4: CV
    log('Updating CV...');
    try {
      const cvLink = page.locator('a:has-text("CV"), a:has-text("Resume"), a:has-text("Upload")').first();
      if (await cvLink.isVisible()) {
        await cvLink.click();
        log('Clicked CV link');
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(logsDir, '05-cv.png'), fullPage: true });
      }
    } catch (e) {
      log(`CV error: ${e.message}`);
    }
    
    await page.screenshot({ path: path.join(logsDir, '06-final.png'), fullPage: true });
    log('Done!');
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    await page.screenshot({ path: path.join(logsDir, 'error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

updateNaukriProfile()
  .then(() => {
    log('Success');
    process.exit(0);
  })
  .catch((error) => {
    log(`Failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
