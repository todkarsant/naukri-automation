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
    // ========== STEP 1: LOGIN ==========
    log('=== STEP 1: LOGIN ===');
    await page.goto(NAUKRI_LOGIN_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(logsDir, '01-login.png'), fullPage: true });
    
    log('Filling credentials...');
    
    // Try multiple selectors for username
    const usernameSelectors = ['#usernameField', 'input[name="USERNAME"]', 'input[id="emailTxt"]', 'input[type="text"]'];
    for (const selector of usernameSelectors) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible()) {
          await field.fill(EMAIL);
          log(`✓ Filled email using: ${selector}`);
          break;
        }
      } catch (e) {
        log(`✗ ${selector} failed`);
      }
    }
    
    // Password field
    const passwordSelectors = ['#pwd1', 'input[name="PASSWORD"]', 'input[type="password"]'];
    for (const selector of passwordSelectors) {
      try {
        const field = page.locator(selector).first();
        if (await field.isVisible()) {
          await field.fill(PASSWORD);
          log(`✓ Filled password using: ${selector}`);
          break;
        }
      } catch (e) {
        log(`✗ ${selector} failed`);
      }
    }
    
    await page.waitForTimeout(3000);
    
    // Click login
    try {
      const loginBtn = page.locator('button[type="submit"], input[type="submit"], .btn-primary').first();
      if (await loginBtn.isVisible()) {
        await loginBtn.click();
        log('✓ Clicked login button');
      }
    } catch (e) {
      log('✗ Login button click failed');
    }
    
    await page.waitForTimeout(15000);
    await page.screenshot({ path: path.join(logsDir, '02-after-login.png'), fullPage: true });
    
    // ========== STEP 2: GO TO EDIT PROFILE ==========
    log('\n=== STEP 2: EDIT PROFILE ===');
    
    // Naukri profile needs "Edit Profile" or "View and Update"
    const editSelectors = [
      'a:has-text("Edit Profile")',
      'a:has-text("View and Update")', 
      'a:has-text("Update Profile")',
      'button:has-text("Edit")',
      'a[href*="edit"]',
      'a[href*="update"]'
    ];
    
    let editClicked = false;
    for (const selector of editSelectors) {
      try {
        const editBtn = page.locator(selector).first();
        if (await editBtn.isVisible()) {
          await editBtn.click();
          log(`✓ Clicked edit using: ${selector}`);
          editClicked = true;
          await page.waitForTimeout(5000);
          break;
        }
      } catch (e) {
        log(`✗ ${selector} failed`);
      }
    }
    
    if (!editClicked) {
      log('! No edit button found, continuing to profile page anyway');
    }
    
    await page.screenshot({ path: path.join(logsDir, '03-edit-profile.png'), fullPage: true });
    
    // ========== STEP 3: UPDATE HEADLINE ==========
    log('\n=== STEP 3: RESUME HEADLINE ===');
    
    const headlinesPath = path.join(__dirname, '..', 'cv-bank', 'headlines.txt');
    let headlines = ['Software Builder | Full Stack Developer'];
    if (fs.existsSync(headlinesPath)) {
      headlines = fs.readFileSync(headlinesPath, 'utf-8').split('\n').filter(l => l.trim());
    }
    const headline = headlines[Math.floor(Math.random() * headlines.length)];
    log(`Selected headline: ${headline}`);
    
    // Find and click headline section to expand it
    const headlineSectionSelectors = [
      'div:has-text("Resume Headline")',
      'label:has-text("Resume Headline")',
      'span:has-text("Resume Headline")',
      'h3:has-text("Headline")',
      'a:has-text("Resume Headline")'
    ];
    
    for (const selector of headlineSectionSelectors) {
      try {
        const section = page.locator(selector).first();
        if (await section.isVisible()) {
          await section.click();
          log(`✓ Clicked headline section: ${selector}`);
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        log(`✗ ${selector} failed`);
      }
    }
    
    // Now fill the headline input
    const headlineInputSelectors = [
      'input[name*="headline" i]',
      'input[id*="headline" i]', 
      'input[placeholder*="headline" i]',
      'textarea[name*="headline" i]',
      'textarea[id*="headline" i]'
    ];
    
    for (const selector of headlineInputSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible()) {
          await input.fill(headline);
          log(`✓ Filled headline using: ${selector}`);
          
          // Look for save/update button near the input
          const saveBtn = page.locator('button:has-text("Save"), input[value="Save"], button:has-text("Update"), input[value="Update"]').first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            log('✓ Saved headline');
            await page.waitForTimeout(5000);
          }
          break;
        }
      } catch (e) {
        log(`✗ ${selector} failed`);
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '04-headline.png'), fullPage: true });
    
    // ========== STEP 4: CV BANK ==========
    log('\n=== STEP 4: CV BANK ===');
    
    // Look for CV/Resume section
    const cvSelectors = [
      'a:has-text("CV")',
      'a:has-text("Resume")',
      'a:has-text("Upload")',
      'a:has-text("CV Bank")',
      'button:has-text("CV")',
      'div:has-text("CV")'
    ];
    
    for (const selector of cvSelectors) {
      try {
        const cvLink = page.locator(selector).first();
        if (await cvLink.isVisible()) {
          await cvLink.click();
          log(`✓ Clicked CV using: ${selector}`);
          await page.waitForTimeout(5000);
          break;
        }
      } catch (e) {
        log(`✗ ${selector} failed`);
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '05-cv-section.png'), fullPage: true });
    
    // Look for CV Bank radio buttons or checkboxes
    const cvRadioSelectors = [
      'input[type="radio"]',
      'input[type="checkbox"]'
    ];
    
    for (const selector of cvRadioSelectors) {
      try {
        const radios = page.locator(selector);
        const count = await radios.count();
        if (count > 0) {
          const randomIdx = Math.floor(Math.random() * count);
          await radios.nth(randomIdx).check();
          log(`✓ Selected CV option ${randomIdx + 1} of ${count}`);
          
          // Save
          const saveBtn = page.locator('button:has-text("Save"), input[value="Save"], button:has-text("Update")').first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            log('✓ Saved CV selection');
            await page.waitForTimeout(5000);
          }
          break;
        }
      } catch (e) {
        log(`✗ CV radio failed: ${e.message}`);
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '06-final.png'), fullPage: true });
    log('\n✓ Update completed!');
    
  } catch (error) {
    log(`\n✗ ERROR: ${error.message}`);
    await page.screenshot({ path: path.join(logsDir, 'error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

updateNaukriProfile()
  .then(() => {
    log('SUCCESS');
    process.exit(0);
  })
  .catch((error) => {
    log(`FAILED: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
