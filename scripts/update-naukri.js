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
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Login
    log('Navigating to Naukri login...');
    await page.goto(NAUKRI_LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(logsDir, '01-login.png') });
    
    log('Filling login form...');
    
    // Find ALL inputs and try to identify email/username field
    const allInputs = await page.locator('input').all();
    log(`Found ${allInputs.length} input elements`);
    
    for (const input of allInputs) {
      try {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        const placeholder = await input.getAttribute('placeholder');
        
        if ((type === 'text' || type === 'email' || !type) && 
            (name && name.toLowerCase().includes('user') || 
             name && name.toLowerCase().includes('email') ||
             name && name.toLowerCase().includes('login') ||
             placeholder && placeholder.toLowerCase().includes('email'))) {
          await input.fill(EMAIL);
          log(`Filled email in input: name=${name}, id=${id}`);
          break;
        }
      } catch (e) {
        // Skip if can't get attributes
      }
    }
    
    // Find password field
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill(PASSWORD);
      log('Filled password');
    }
    
    await page.screenshot({ path: path.join(logsDir, '02-filled.png') });
    
    // Find and click submit button
    log('Looking for submit button...');
    const allButtons = await page.locator('button, input[type="submit"], a.button').all();
    log(`Found ${allButtons.length} button elements`);
    
    for (const button of allButtons) {
      try {
        const text = await button.textContent();
        const value = await button.getAttribute('value');
        const type = await button.getAttribute('type');
        
        if ((text && text.toLowerCase().includes('login')) ||
            (text && text.toLowerCase().includes('sign in')) ||
            (value && value.toLowerCase().includes('login')) ||
            type === 'submit') {
          await button.click();
          log(`Clicked button with text: ${text}, value: ${value}`);
          break;
        }
      } catch (e) {
        // Skip if can't interact
      }
    }
    
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(logsDir, '03-after-login.png') });
    
    // Step 2: Go to profile
    log('Going to profile page...');
    await page.goto(NAUKRI_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(logsDir, '04-profile.png') });
    
    // Step 3: Update headline
    log('Attempting to update headline...');
    try {
      // Read headlines
      const headlinesPath = path.join(__dirname, '..', 'cv-bank', 'headlines.txt');
      let headlines = ['Software Builder | Full Stack Developer'];
      
      if (fs.existsSync(headlinesPath)) {
        const content = fs.readFileSync(headlinesPath, 'utf-8');
        headlines = content.split('\n').filter(line => line.trim() !== '');
      }
      
      const randomHeadline = headlines[Math.floor(Math.random() * headlines.length)];
      log(`Selected headline: ${randomHeadline}`);
      
      // Find all inputs and look for headline
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        try {
          const name = await input.getAttribute('name');
          const id = await input.getAttribute('id');
          const placeholder = await input.getAttribute('placeholder');
          
          if ((name && name.toLowerCase().includes('headline')) ||
              (id && id.toLowerCase().includes('headline')) ||
              (placeholder && placeholder.toLowerCase().includes('headline'))) {
            await input.fill(randomHeadline);
            log('Headline filled successfully');
            
            // Try to save
            const saveButtons = await page.locator('button, input[type="submit"]').all();
            for (const btn of saveButtons) {
              try {
                const btnText = await btn.textContent();
                if (btnText && (btnText.toLowerCase().includes('save') || btnText.toLowerCase().includes('update'))) {
                  await btn.click();
                  log('Saved headline');
                  break;
                }
              } catch (e) {}
            }
            break;
          }
        } catch (e) {}
      }
    } catch (error) {
      log(`Headline error: ${error.message}`);
    }
    
    // Step 4: Update CV
    log('Attempting to update CV...');
    try {
      // Find CV-related links/buttons
      const allLinks = await page.locator('a').all();
      for (const link of allLinks) {
        try {
          const text = await link.textContent();
          if (text && (text.toLowerCase().includes('cv') || text.toLowerCase().includes('resume'))) {
            await link.click();
            log('Clicked CV/resume link');
            await page.waitForTimeout(5000);
            await page.screenshot({ path: path.join(logsDir, '05-cv-section.png') });
            break;
          }
        } catch (e) {}
      }
      
      // Look for CV bank
      const allElements = await page.locator('*').all();
      for (const el of allElements) {
        try {
          const text = await el.textContent();
          if (text && text.toLowerCase().includes('cv bank')) {
            await el.click();
            log('Clicked CV Bank');
            await page.waitForTimeout(5000);
            break;
          }
        } catch (e) {}
      }
    } catch (error) {
      log(`CV error: ${error.message}`);
    }
    
    await page.screenshot({ path: path.join(logsDir, '06-final.png') });
    log('Update completed!');
    
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
    log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    log(`Script failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
