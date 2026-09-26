const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const NAUKRI_LOGIN_URL = 'https://www.naukri.com/login';
const NAUKRI_PROFILE_URL = 'https://www.naukri.com/mnjuser/profile';
const EMAIL = process.env.NAUKRI_EMAIL;
const PASSWORD = process.env.NAUKRI_PASSWORD;

// Create logs directory
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

async function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function updateNaukriProfile() {
  log('Starting Naukri profile update...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Login to Naukri
    log('Navigating to Naukri login page...');
    await page.goto(NAUKRI_LOGIN_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for page to fully load
    
    // Take screenshot for debugging
    await page.screenshot({ path: path.join(logsDir, '01-login-page.png') });
    
    // Find and fill login form
    log('Attempting to login...');
    
    // Try to find email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(EMAIL);
      log('Email entered');
    } else {
      log('Email input not found, trying alternative selectors');
      // Try common Naukri selectors
      await page.fill('input[name="username"]', EMAIL).catch(() => {});
    }
    
    // Find password input
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(PASSWORD);
      log('Password entered');
    }
    
    // Take screenshot before login
    await page.screenshot({ path: path.join(logsDir, '02-before-login.png') });
    
    // Click login button
    const loginButton = page.locator('button[type="submit"], input[type="submit"], button:contains("Login"), button:contains("Sign In")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      log('Login button clicked');
      await page.waitForTimeout(5000); // Wait for login to process
    }
    
    // Check if login was successful
    await page.screenshot({ path: path.join(logsDir, '03-after-login.png') });
    
    // Step 2: Navigate to profile
    log('Navigating to profile page...');
    await page.goto(NAUKRI_PROFILE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: path.join(logsDir, '04-profile-page.png') });
    
    // Step 3: Update Resume Headline
    log('Updating resume headline...');
    try {
      // Read headlines from file
      const headlinesPath = path.join(__dirname, '..', 'cv-bank', 'headlines.txt');
      let headlines = ['Software Builder | Full Stack Developer | Cloud Enthusiast'];
      
      if (fs.existsSync(headlinesPath)) {
        const content = fs.readFileSync(headlinesPath, 'utf-8');
        headlines = content.split('\n').filter(line => line.trim() !== '');
        log(`Loaded ${headlines.length} headlines from file`);
      }
      
      const randomHeadline = await getRandomItem(headlines);
      log(`Selected headline: ${randomHeadline}`);
      
      // Find headline input field
      const headlineInput = page.locator('input[placeholder*="headline" i], input[name*="headline" i], input[id*="headline" i]').first();
      if (await headlineInput.isVisible()) {
        await headlineInput.fill(randomHeadline);
        log('Headline updated');
      } else {
        log('Headline input not found, trying to find edit button');
        // Look for edit button for headline section
        const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), span:has-text("Edit")').filter({ hasText: /headline/i }).first();
        if (await editButton.isVisible()) {
          await editButton.click();
          await page.waitForTimeout(2000);
          await headlineInput.fill(randomHeadline);
        }
      }
    } catch (error) {
      log(`Error updating headline: ${error.message}`);
    }
    
    // Step 4: Update CV from CV Bank
    log('Updating CV from CV bank...');
    try {
      // Find CV/Resume section
      const cvSection = page.locator('a:has-text("CV"), a:has-text("Resume"), button:has-text("Upload"), button:has-text("Update")').first();
      
      if (await cvSection.isVisible()) {
        await cvSection.click();
        await page.waitForTimeout(3000);
        log('CV section accessed');
        
        // Look for CV bank option
        const cvBankOption = page.locator('a:has-text("CV Bank"), button:has-text("CV Bank"), span:has-text("CV Bank")').first();
        if (await cvBankOption.isVisible()) {
          await cvBankOption.click();
          await page.waitForTimeout(3000);
          log('CV Bank accessed');
          
          // Select a random CV
          const cvOptions = page.locator('input[type="radio"], input[type="checkbox"]');
          const count = await cvOptions.count();
          
          if (count > 0) {
            const randomIndex = Math.floor(Math.random() * count);
            await cvOptions.nth(randomIndex).check();
            await page.waitForTimeout(2000);
            log(`Selected CV option ${randomIndex + 1} of ${count}`);
            
            // Save/Update
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), input[type="submit"]').first();
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(3000);
              log('CV selection saved');
            }
          }
        }
      }
    } catch (error) {
      log(`Error updating CV: ${error.message}`);
    }
    
    // Final screenshot
    await page.screenshot({ path: path.join(logsDir, '05-final-state.png') });
    
    log('Naukri profile update completed successfully!');
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    await page.screenshot({ path: path.join(logsDir, 'error-screenshot.png') });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the update
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
