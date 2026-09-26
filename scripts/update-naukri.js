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
    // ========== LOGIN ==========
    log('=== LOGIN ===');
    await page.goto(NAUKRI_LOGIN_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(10000);
    
    // Fill credentials using multiple methods
    const usernameFields = await page.$$('input[type="text"], input[type="email"], input[name="USERNAME"], #usernameField');
    log(`Found ${usernameFields.length} potential username fields`);
    
    for (const field of usernameFields) {
      try {
        await field.fill(EMAIL);
        log('✓ Filled email');
        break;
      } catch (e) {}
    }
    
    const passwordFields = await page.$$('input[type="password"], #pwd1, input[name="PASSWORD"]');
    log(`Found ${passwordFields.length} password fields`);
    
    for (const field of passwordFields) {
      try {
        await field.fill(PASSWORD);
        log('✓ Filled password');
        break;
      } catch (e) {}
    }
    
    await page.waitForTimeout(3000);
    
    // Click any submit button
    const submitButtons = await page.$$('button[type="submit"], input[type="submit"], .btn-primary, button.login-btn');
    log(`Found ${submitButtons.length} submit buttons`);
    
    for (const btn of submitButtons) {
      try {
        await btn.click();
        log('✓ Clicked login button');
        break;
      } catch (e) {}
    }
    
    await page.waitForTimeout(15000);
    await page.screenshot({ path: path.join(logsDir, '02-after-login.png'), fullPage: true });
    
    // ========== GO TO PROFILE ==========
    log('\n=== PROFILE ===');
    await page.goto(NAUKRI_PROFILE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(15000);
    
    // Save page HTML for debugging
    const profileHTML = await page.content();
    fs.writeFileSync(path.join(logsDir, 'profile-page.html'), profileHTML);
    log('✓ Saved profile page HTML');
    
    await page.screenshot({ path: path.join(logsDir, '03-profile.png'), fullPage: true });
    
    // Find ALL links and buttons on the page
    const allLinks = await page.$$eval('a', els => els.map(el => ({
      text: (el.textContent || '').trim().substring(0, 50),
      href: el.href || '',
      class: el.className || ''
    })).filter(l => l.text));
    
    const allButtons = await page.$$eval('button, input[type="submit"], input[type="button"]', els => els.map(el => ({
      text: (el.textContent || el.value || '').trim().substring(0, 50),
      type: el.type || '',
      class: el.className || ''
    })).filter(b => b.text));
    
    log(`Found ${allLinks.length} links with text`);
    log(`Found ${allButtons.length} buttons with text`);
    
    // Log links that might be edit/profile related
    const editLinks = allLinks.filter(l => 
      l.text.toLowerCase().includes('edit') || 
      l.text.toLowerCase().includes('update') ||
      l.text.toLowerCase().includes('profile') ||
      l.href.includes('edit') ||
      l.href.includes('update')
    );
    log(`Potential edit links: ${editLinks.length}`);
    editLinks.forEach(l => log(`  - "${l.text}" -> ${l.href.substring(0, 80)}`));
    
    // Click first edit/update link if found
    if (editLinks.length > 0) {
      const editLink = page.locator('a').filter({ hasText: /edit|update/i }).first();
      try {
        await editLink.click();
        log('✓ Clicked edit link');
        await page.waitForTimeout(8000);
        await page.screenshot({ path: path.join(logsDir, '04-after-edit-click.png'), fullPage: true });
        
        // Save HTML after clicking edit
        const editHTML = await page.content();
        fs.writeFileSync(path.join(logsDir, 'edit-page.html'), editHTML);
      } catch (e) {
        log(`✗ Click failed: ${e.message}`);
      }
    }
    
    // ========== HEADLINE ==========
    log('\n=== HEADLINE ===');
    
    const headlinesPath = path.join(__dirname, '..', 'cv-bank', 'headlines.txt');
    let headlines = ['Software Builder | Full Stack Developer'];
    if (fs.existsSync(headlinesPath)) {
      headlines = fs.readFileSync(headlinesPath, 'utf-8').split('\n').filter(l => l.trim());
    }
    const headline = headlines[Math.floor(Math.random() * headlines.length)];
    log(`Selected: "${headline}"`);
    
    // Find ALL inputs on the page
    const allInputs = await page.$$eval('input, textarea', els => els.map((el, i) => ({
      index: i,
      type: el.type || 'text',
      name: el.name || '',
      id: el.id || '',
      placeholder: el.placeholder || '',
      value: (el.value || '').substring(0, 30)
    })));
    
    log(`Found ${allInputs.length} total inputs`);
    
    // Look for headline-related inputs
    const headlineInputs = allInputs.filter(inp => 
      inp.name.toLowerCase().includes('headline') ||
      inp.id.toLowerCase().includes('headline') ||
      inp.placeholder.toLowerCase().includes('headline')
    );
    
    log(`Found ${headlineInputs.length} headline inputs`);
    headlineInputs.forEach(inp => log(`  - idx:${inp.index} name:"${inp.name}" id:"${inp.id}"`));
    
    if (headlineInputs.length > 0) {
      const targetInput = headlineInputs[0];
      try {
        await page.locator(`input:nth-of-type(${targetInput.index + 1}), textarea:nth-of-type(${targetInput.index + 1})`).fill(headline);
        log('✓ Filled headline');
        
        // Click any save button
        const saveBtns = await page.$$('button:has-text("Save"), input[value="Save"], button:has-text("Update")');
        if (saveBtns.length > 0) {
          await saveBtns[0].click();
          log('✓ Clicked save');
          await page.waitForTimeout(5000);
        }
      } catch (e) {
        log(`✗ Fill failed: ${e.message}`);
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '05-after-headline.png'), fullPage: true });
    
    // ========== CV BANK ==========
    log('\n=== CV BANK ===');
    
    // Look for CV-related elements
    const cvLinks = allLinks.filter(l => 
      l.text.toLowerCase().includes('cv') || 
      l.text.toLowerCase().includes('resume') ||
      l.text.toLowerCase().includes('upload')
    );
    log(`Found ${cvLinks.length} CV-related links`);
    cvLinks.forEach(l => log(`  - "${l.text}"`));
    
    if (cvLinks.length > 0) {
      try {
        const cvLink = page.locator('a').filter({ hasText: /cv|resume|upload/i }).first();
        await cvLink.click();
        log('✓ Clicked CV link');
        await page.waitForTimeout(8000);
        await page.screenshot({ path: path.join(logsDir, '06-cv-section.png'), fullPage: true });
        
        // Look for radio buttons in CV section
        const radios = await page.$$('input[type="radio"], input[type="checkbox"]');
        log(`Found ${radios.length} radio/checkbox inputs`);
        
        if (radios.length > 0) {
          const randomIdx = Math.floor(Math.random() * radios.length);
          await radios[randomIdx].check();
          log(`✓ Selected option ${randomIdx + 1}`);
          
          // Save
          const saveBtns = await page.$$('button:has-text("Save"), input[value="Save"]');
          if (saveBtns.length > 0) {
            await saveBtns[0].click();
            log('✓ Saved CV selection');
            await page.waitForTimeout(5000);
          }
        }
      } catch (e) {
        log(`✗ CV update failed: ${e.message}`);
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '07-final.png'), fullPage: true });
    log('\n✓ Done!');
    
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
