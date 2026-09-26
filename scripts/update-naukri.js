const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Try multiple login URLs - mobile often has less strict bot detection
const LOGIN_URLS = [
  'https://mobile.naukri.com/login',
  'https://www.naukri.com/login',
  'https://my.naukri.com/',
  'https://www.naukri.com/nlogin/authIntro'
];
const PROFILE_URL = 'https://www.naukri.com/mnjuser/profile';
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

async function tryLogin(page, loginUrl) {
  log(`\nTrying login URL: ${loginUrl}`);
  
  try {
    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);
    
    const title = await page.title();
    log(`Page title: "${title}"`);
    
    // Check if we got blocked
    if (title.toLowerCase().includes('access denied') || title.toLowerCase().includes('error')) {
      log('✗ Blocked by WAF');
      return false;
    }
    
    // Take screenshot
    await page.screenshot({ path: path.join(logsDir, `login-${loginUrl.replace(/[^a-z]/g, '-')}.png`), fullPage: true });
    
    // Try to find and fill login form
    const inputs = await page.$$('input');
    log(`Found ${inputs.length} input elements`);
    
    let filled = false;
    for (const input of inputs) {
      try {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        
        if ((type === 'text' || type === 'email' || !type) && 
            (name && (name.toLowerCase().includes('user') || name.toLowerCase().includes('email') || name.toLowerCase().includes('login')) ||
             placeholder && placeholder.toLowerCase().includes('email'))) {
          await input.fill(EMAIL);
          log('✓ Filled email');
          filled = true;
          break;
        }
      } catch (e) {}
    }
    
    if (!filled) {
      log('✗ Could not find email field');
      return false;
    }
    
    // Fill password
    const passwords = await page.$$('input[type="password"]');
    if (passwords.length > 0) {
      await passwords[0].fill(PASSWORD);
      log('✓ Filled password');
    }
    
    await page.waitForTimeout(3000);
    
    // Click submit
    const submits = await page.$$('button[type="submit"], input[type="submit"]');
    if (submits.length > 0) {
      await submits[0].click();
      log('✓ Clicked submit');
    }
    
    await page.waitForTimeout(15000);
    
    // Check if login succeeded
    const currentUrl = page.url();
    log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('login') && !currentUrl.includes('logout')) {
      log('✗ Still on login page');
      return false;
    }
    
    log('✓ Login successful!');
    return true;
    
  } catch (error) {
    log(`✗ Login attempt failed: ${error.message}`);
    return false;
  }
}

async function updateNaukriProfile() {
  log('=== NAUKRI PROFILE UPDATE ===');
  
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
    viewport: { width: 375, height: 812 }, // Mobile viewport
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  // Bypass automation detection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  
  try {
    // Try each login URL
    let loginSuccess = false;
    for (const loginUrl of LOGIN_URLS) {
      if (await tryLogin(page, loginUrl)) {
        loginSuccess = true;
        break;
      }
      await page.waitForTimeout(5000);
    }
    
    if (!loginSuccess) {
      throw new Error('All login attempts failed - Naukri is blocking automated access');
    }
    
    await page.screenshot({ path: path.join(logsDir, '01-logged-in.png'), fullPage: true });
    
    // Go to profile
    log('\n=== GOING TO PROFILE ===');
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(15000);
    
    const profileTitle = await page.title();
    log(`Profile page title: "${profileTitle}"`);
    
    if (profileTitle.toLowerCase().includes('access denied')) {
      throw new Error('Profile page blocked by WAF');
    }
    
    await page.screenshot({ path: path.join(logsDir, '02-profile.png'), fullPage: true });
    
    // Save HTML
    const html = await page.content();
    fs.writeFileSync(path.join(logsDir, 'profile.html'), html);
    log('✓ Saved profile HTML');
    
    // Find all visible inputs
    const inputs = await page.$$eval('input, textarea', els =>
      els.map((el, i) => ({
        idx: i,
        tag: el.tagName,
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        value: (el.value || '').substring(0, 30)
      }))
    );
    
    log(`\nFound ${inputs.length} inputs/textarea elements`);
    inputs.slice(0, 15).forEach(inp => 
      log(`  [${inp.idx}] ${inp.tag} type="${inp.type}" name="${inp.name}" id="${inp.id}"`)
    );
    
    // Find headline input
    const headlineInputs = inputs.filter(inp => 
      (inp.name && inp.name.toLowerCase().includes('headline')) ||
      (inp.id && inp.id.toLowerCase().includes('headline')) ||
      (inp.placeholder && inp.placeholder.toLowerCase().includes('headline'))
    );
    
    log(`\nFound ${headlineInputs.length} headline inputs`);
    
    // Update headline
    log('\n=== UPDATING HEADLINE ===');
    const headlinesPath = path.join(__dirname, '..', 'cv-bank', 'headlines.txt');
    let headlines = ['Software Builder'];
    if (fs.existsSync(headlinesPath)) {
      headlines = fs.readFileSync(headlinesPath, 'utf-8').split('\n').filter(l => l.trim());
    }
    const headline = headlines[Math.floor(Math.random() * headlines.length)];
    log(`Selected: "${headline}"`);
    
    if (headlineInputs.length > 0) {
      const target = headlineInputs[0];
      const selector = target.tag === 'TEXTAREA' ? `textarea:nth-of-type(${target.idx + 1})` : `input:nth-of-type(${target.idx + 1})`;
      
      try {
        await page.locator(selector).fill(headline);
        log('✓ Filled headline');
        
        // Save
        const saveBtns = await page.$$('button:has-text("Save"), input[value="Save"], input[value="Update"]');
        if (saveBtns.length > 0) {
          await saveBtns[0].click();
          log('✓ Saved headline');
          await page.waitForTimeout(5000);
        }
      } catch (e) {
        log(`✗ Failed: ${e.message}`);
      }
    } else {
      log('! No headline input found - profile may be read-only or needs edit mode');
    }
    
    await page.screenshot({ path: path.join(logsDir, '03-after-headline.png'), fullPage: true });
    
    // CV Bank
    log('\n=== CV BANK ===');
    const links = await page.$$eval('a', els =>
      els.map(el => ({
        text: (el.textContent || '').trim().substring(0, 60),
        href: el.href
      })).filter(l => l.text)
    );
    
    const cvLinks = links.filter(l => 
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
        await page.screenshot({ path: path.join(logsDir, '04-cv.png'), fullPage: true });
      } catch (e) {
        log(`✗ CV click failed: ${e.message}`);
      }
    }
    
    await page.screenshot({ path: path.join(logsDir, '05-final.png'), fullPage: true });
    log('\n✓ COMPLETED!');
    
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
