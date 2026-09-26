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
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(path.join(logsDir, 'naukri-update.log'), logMessage);
}

async function updateNaukriProfile() {
  log('Starting Naukri profile update...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // STEP 1: LOGIN
    log('Going to Naukri login...');
    await page.goto(NAUKRI_LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(logsDir, '01-login.png') });
    
    log('Filling credentials...');
    
    // Get ALL inputs
    const inputs = await page.$$eval('input', els => 
      els.map((el, i) => ({
        index: i,
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder
      }))
    );
    
    log(`Found ${inputs.length} inputs`);
    
    // Find email/username input
    for (const input of inputs) {
      const type = input.type || 'text';
      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      
      if ((type === 'text' || type === 'email' || type === '') &&
          (name.includes('user') || name.includes('email') || name.includes('login') ||
           id.includes('user') || id.includes('email') ||
           placeholder.includes('email'))) {
        await page.locator(`input:nth-of-type(${input.index + 1})`).fill(EMAIL);
        log(`Filled email in input[${input.index}]: name=${input.name}, id=${input.id}`);
        break;
      }
    }
    
    // Find password input
    for (const input of inputs) {
      if (input.type === 'password') {
        await page.locator(`input:nth-of-type(${input.index + 1})`).fill(PASSWORD);
        log(`Filled password in input[${input.index}]`);
        break;
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '02-filled.png') });
    
    // Get ALL buttons and clickable elements
    const buttons = await page.$$eval('button, input[type="submit"], a.button, [role="button"]', els =>
      els.map((el, i) => ({
        index: i,
        tag: el.tagName,
        type: el.type,
        text: (el.textContent || '').trim().toLowerCase(),
        value: (el.value || '').toLowerCase()
      }))
    );
    
    log(`Found ${buttons.length} buttons`);
    
    // Find login button
    for (const btn of buttons) {
      if (btn.text.includes('login') || btn.text.includes('sign in') || btn.type === 'submit') {
        try {
          await page.locator(`button:nth-of-type(${btn.index + 1}), input[type="submit"]:nth-of-type(${btn.index + 1})`).click();
          log(`Clicked button[${btn.index}]: ${btn.text}`);
          break;
        } catch (e) {
          log(`Failed to click button[${btn.index}]: ${e.message}`);
        }
      }
    }
    
    await page.waitForTimeout(12000);
    await page.screenshot({ path: path.join(logsDir, '03-after-login.png') });
    
    // STEP 2: PROFILE
    log('Going to profile...');
    await page.goto(NAUKRI_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12000);
    await page.screenshot({ path: path.join(logsDir, '04-profile.png') });
    
    // STEP 3: HEADLINE
    log('Updating headline...');
    try {
      const headlinesPath = path.join(__dirname, '..', 'cv-bank', 'headlines.txt');
      let headlines = ['Software Builder'];
      
      if (fs.existsSync(headlinesPath)) {
        headlines = fs.readFileSync(headlinesPath, 'utf-8')
          .split('\n').filter(l => l.trim());
      }
      
      const headline = headlines[Math.floor(Math.random() * headlines.length)];
      log(`Selected: ${headline}`);
      
      // Get all inputs on profile page
      const profileInputs = await page.$$eval('input', els =>
        els.map((el, i) => ({
          index: i,
          name: (el.name || '').toLowerCase(),
          id: (el.id || '').toLowerCase(),
          placeholder: (el.placeholder || '').toLowerCase()
        }))
      );
      
      for (const inp of profileInputs) {
        if (inp.name.includes('headline') || inp.id.includes('headline') || inp.placeholder.includes('headline')) {
          await page.locator(`input:nth-of-type(${inp.index + 1})`).fill(headline);
          log(`Filled headline in input[${inp.index}]`);
          
          // Click save
          const saveBtns = await page.$$eval('button, input[type="submit"]', els =>
            els.map((el, i) => ({ index: i, text: (el.textContent || '').toLowerCase() }))
          );
          
          for (const sb of saveBtns) {
            if (sb.text.includes('save') || sb.text.includes('update')) {
              await page.locator(`button:nth-of-type(${sb.index + 1})`).click();
              log('Saved headline');
              break;
            }
          }
          break;
        }
      }
    } catch (e) {
      log(`Headline error: ${e.message}`);
    }
    
    // STEP 4: CV
    log('Updating CV...');
    try {
      const links = await page.$$eval('a', els =>
        els.map((el, i) => ({ index: i, text: (el.textContent || '').toLowerCase() }))
      );
      
      for (const link of links) {
        if (link.text.includes('cv') || link.text.includes('resume')) {
          await page.locator(`a:nth-of-type(${link.index + 1})`).click();
          log('Clicked CV link');
          await page.waitForTimeout(6000);
          break;
        }
      }
      
      await page.screenshot({ path: path.join(logsDir, '05-cv.png') });
    } catch (e) {
      log(`CV error: ${e.message}`);
    }
    
    await page.screenshot({ path: path.join(logsDir, '06-final.png') });
    log('Done!');
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    await page.screenshot({ path: path.join(logsDir, 'error.png') });
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
