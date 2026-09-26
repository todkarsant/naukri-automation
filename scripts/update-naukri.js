const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const NAUKRI_LOGIN_URL = 'https://www.naukri.com/login';
const NAUKRI_PROFILE_URL = 'https://www.naukri.com/mnjuser/profile';
const NAUKRI_HOMEPAGE = 'https://www.naukri.com/';
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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }
  });
  
  const page = await context.newPage();
  
  // Bypass automation detection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  
  try {
    // ========== LOGIN ==========
    log('=== STEP 1: LOGIN ===');
    await page.goto(NAUKRI_LOGIN_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(10000);
    
    await page.screenshot({ path: path.join(logsDir, '01-login-page.png'), fullPage: true });
    
    // Check if we're actually on login page
    const pageTitle = await page.title();
    log(`Page title: "${pageTitle}"`);
    
    // Try to fill credentials
    let emailFilled = false;
    let passwordFilled = false;
    
    // Method 1: By visible text inputs
    const textInputs = await page.$$('input[type="text"], input[type="email"]');
    log(`Found ${textInputs.length} text/email inputs`);
    
    for (const input of textInputs) {
      try {
        const isVisible = await input.isVisible();
        if (isVisible) {
          await input.fill(EMAIL);
          log('✓ Filled email in text input');
          emailFilled = true;
          break;
        }
      } catch (e) {
        log(`✗ Fill failed: ${e.message}`);
      }
    }
    
    // Method 2: Try by name/id if above failed
    if (!emailFilled) {
      try {
        await page.fill('input[name="USERNAME"]', EMAIL);
        log('✓ Filled email by name=USERNAME');
        emailFilled = true;
      } catch (e) {
        log('✗ name=USERNAME not found');
      }
    }
    
    // Password
    const passwordInputs = await page.$$('input[type="password"]');
    log(`Found ${passwordInputs.length} password inputs`);
    
    for (const input of passwordInputs) {
      try {
        const isVisible = await input.isVisible();
        if (isVisible) {
          await input.fill(PASSWORD);
          log('✓ Filled password');
          passwordFilled = true;
          break;
        }
      } catch (e) {}
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(logsDir, '02-filled.png'), fullPage: true });
    
    // Click login button
    const submitButtons = await page.$$('button[type="submit"], input[type="submit"]');
    log(`Found ${submitButtons.length} submit buttons`);
    
    if (submitButtons.length > 0) {
      await submitButtons[0].click();
      log('✓ Clicked submit button');
    } else {
      // Try any button
      const anyButton = await page.$$('button, .btn, a.button').first();
      if (await anyButton.isVisible()) {
        await anyButton.click();
        log('✓ Clicked any button');
      }
    }
    
    // Wait for login to complete
    log('Waiting for login...');
    await page.waitForTimeout(20000);
    
    await page.screenshot({ path: path.join(logsDir, '03-after-login.png'), fullPage: true });
    
    // Verify login succeeded by checking if we're redirected
    const currentUrl = page.url();
    log(`Current URL after login: ${currentUrl}`);
    
    // If still on login page, login failed
    if (currentUrl.includes('login')) {
      log('✗ Still on login page - login may have failed');
      // Try one more time with different approach
      await page.goto(NAUKRI_HOMEPAGE, { waitUntil: 'networkidle' });
      await page.waitForTimeout(10000);
      await page.screenshot({ path: path.join(logsDir, '04-homepage.png'), fullPage: true });
    }
    
    // ========== GO TO PROFILE ==========
    log('\n=== STEP 2: PROFILE ===');
    
    // Try multiple profile URLs
    const profileURLs = [
      'https://www.naukri.com/mnjuser/profile',
      'https://www.naukri.com/profile',
      'https://my.naukri.com/profile'
    ];
    
    let profileLoaded = false;
    for (const url of profileURLs) {
      try {
        log(`Trying: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(15000);
        
        const pageContent = await page.content();
        if (pageContent.includes('Access Denied') || pageContent.includes('edgesuite')) {
          log('✗ Access Denied page');
          continue;
        }
        
        if (pageContent.length > 5000) {
          log('✓ Profile page loaded successfully');
          profileLoaded = true;
          await page.screenshot({ path: path.join(logsDir, '05-profile.png'), fullPage: true });
          break;
        }
      } catch (e) {
        log(`✗ ${url} failed: ${e.message}`);
      }
    }
    
    if (!profileLoaded) {
      log('✗ Could not load profile page - stopping');
      await page.screenshot({ path: path.join(logsDir, 'error-profile.png'), fullPage: true });
      throw new Error('Profile page not accessible');
    }
    
    // Save HTML for debugging
    const html = await page.content();
    fs.writeFileSync(path.join(logsDir, 'profile.html'), html);
    log('✓ Saved profile HTML');
    
    // ========== FIND ELEMENTS ==========
    log('\n=== STEP 3: FINDING ELEMENTS ===');
    
    const allInputs = await page.$$eval('input, textarea', els => 
      els.map((el, i) => ({
        idx: i,
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        visible: el.offsetParent !== null
      })).filter(inp => inp.visible)
    );
    
    log(`Found ${allInputs.length} visible inputs`);
    allInputs.slice(0, 10).forEach(inp => 
      log(`  [${inp.idx}] type=${inp.type} name="${inp.name}" id="${inp.id}"`)
    );
    
    const allLinks = await page.$$eval('a', els =>
      els.map(el => ({
        text: (el.textContent || '').trim().substring(0, 60),
        href: el.href
      })).filter(l => l.text && l.text.length > 0)
    );
    
    log(`Found ${allLinks.length} links with text`);
    
    // Look for edit/profile links
    const editLinks = allLinks.filter(l => 
      l.text.toLowerCase().includes('edit') || 
      l.text.toLowerCase().includes('update') ||
      l.href.toLowerCase().includes('edit') ||
      l.href.toLowerCase().includes('update')
    );
    
    log(`Found ${editLinks.length} edit/update links`);
    editLinks.forEach(l => log(`  - "${l.text}"`));
    
    // ========== HEADLINE ==========
    log('\n=== STEP 4: HEADLINE ===');
    
    const headlinesPath = path.join(__dirname, '..', 'cv-bank', 'headlines.txt');
    let headlines = ['Software Builder'];
    if (fs.existsSync(headlinesPath)) {
      headlines = fs.readFileSync(headlinesPath, 'utf-8').split('\n').filter(l => l.trim());
    }
    const headline = headlines[Math.floor(Math.random() * headlines.length)];
    log(`Selected: "${headline}"`);
    
    // Find headline input
    const headlineInputs = allInputs.filter(inp => 
      (inp.name && inp.name.toLowerCase().includes('headline')) ||
      (inp.id && inp.id.toLowerCase().includes('headline')) ||
      (inp.placeholder && inp.placeholder.toLowerCase().includes('headline'))
    );
    
    log(`Found ${headlineInputs.length} headline inputs`);
    
    if (headlineInputs.length > 0) {
      const target = headlineInputs[0];
      try {
        const selector = target.type === 'textarea' ? `textarea:nth-of-type(${target.idx + 1})` : `input:nth-of-type(${target.idx + 1})`;
        await page.locator(selector).fill(headline);
        log('✓ Filled headline');
        
        // Click save
        const saveBtns = await page.$$('button:has-text("Save"), input[value="Save"]');
        if (saveBtns.length > 0) {
          await saveBtns[0].click();
          log('✓ Saved');
          await page.waitForTimeout(5000);
        }
      } catch (e) {
        log(`✗ Failed: ${e.message}`);
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '06-after-headline.png'), fullPage: true });
    
    // ========== CV BANK ==========
    log('\n=== STEP 5: CV BANK ===');
    
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
        await page.screenshot({ path: path.join(logsDir, '07-cv.png'), fullPage: true });
      } catch (e) {
        log(`✗ CV click failed: ${e.message}`);
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '08-final.png'), fullPage: true });
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
