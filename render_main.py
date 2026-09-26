#!/usr/bin/env python3
"""
Naukri Profile Updater - Render Optimized Version
Uses Playwright with better error handling for cloud environments
"""

import os
import sys
import random
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError

# Configuration
NAUKRI_EMAIL = os.getenv("NAUKRI_EMAIL", "todkarsant@gmail.com")
NAUKRI_PASSWORD = os.getenv("NAUKRI_PASSWORD")
HEADLINES_FILE = "cv-bank/headlines.txt"

def log(message):
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] {message}", flush=True)

def get_random_headline():
    try:
        with open(HEADLINES_FILE, 'r', encoding='utf-8') as f:
            headlines = [line.strip() for line in f if line.strip()]
        return random.choice(headlines) if headlines else "Software Builder | Full Stack Developer"
    except:
        return "Software Builder | Full Stack Developer"

def update_profile():
    log("=== NAUKRI PROFILE UPDATE (RENDER) ===")
    log(f"Email: {NAUKRI_EMAIL}")
    
    try:
        with sync_playwright() as p:
            # Launch with extra args for cloud environments
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            )
            
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            
            page = context.new_page()
            
            try:
                # Login
                log("\nGoing to Naukri login...")
                page.goto("https://www.naukri.com/login", wait_until="networkidle", timeout=60000)
                page.wait_for_timeout(8000)
                
                # Check if blocked by WAF
                page_title = page.title()
                if "Access Denied" in page_title or "edgesuite" in page_title.lower():
                    log("✗ BLOCKED BY WAF - Naukri is blocking cloud IPs")
                    browser.close()
                    return False
                
                log(f"✓ Login page loaded (title: {page_title})")
                
                # Fill credentials
                log("Filling credentials...")
                try:
                    # Try multiple selectors
                    selectors = [
                        'input[name="USERNAME"]',
                        'input[type="email"]',
                        'input[id="usernameField"]',
                        'input[placeholder*="email" i]'
                    ]
                    
                    for selector in selectors:
                        try:
                            field = page.locator(selector).first()
                            if field.is_visible():
                                field.fill(NAUKRI_EMAIL)
                                log(f"✓ Filled email using: {selector}")
                                break
                        except:
                            continue
                    
                    # Password
                    password_field = page.locator('input[type="password"]').first()
                    if password_field.is_visible():
                        password_field.fill(NAUKRI_PASSWORD)
                        log("✓ Filled password")
                    
                    # Submit
                    submit_btn = page.locator('button[type="submit"], input[type="submit"]').first()
                    if submit_btn.is_visible():
                        submit_btn.click()
                        log("✓ Login submitted")
                        page.wait_for_timeout(15000)
                    
                except Exception as e:
                    log(f"✗ Login failed: {e}")
                    browser.close()
                    return False
                
                # Go to profile
                log("\nGoing to profile...")
                page.goto("https://www.naukri.com/mnjuser/profile", wait_until="networkidle", timeout=60000)
                page.wait_for_timeout(10000)
                
                # Update headline
                headline = get_random_headline()
                log(f"Selected headline: \"{headline}\"")
                
                try:
                    headline_input = page.locator('input[placeholder*="headline" i], input[name*="headline" i]').first()
                    if headline_input.is_visible():
                        headline_input.fill(headline)
                        log("✓ Headline updated")
                        
                        save_btn = page.locator('button:has-text("Save"), input[value="Save"]').first()
                        if save_btn.is_visible():
                            save_btn.click()
                            page.wait_for_timeout(5000)
                            log("✓ Saved")
                    else:
                        log("! Headline field not found")
                except Exception as e:
                    log(f"✗ Headline update failed: {e}")
                
                log("\n✓ COMPLETED!")
                browser.close()
                return True
                
            except TimeoutError as e:
                log(f"✗ Timeout: {e}")
                browser.close()
                return False
            except Exception as e:
                log(f"✗ Error: {e}")
                browser.close()
                return False
                
    except Exception as e:
        log(f"✗ Playwright failed: {e}")
        log("This usually means Playwright browsers aren't installed properly")
        return False

if __name__ == "__main__":
    success = update_profile()
    sys.exit(0 if success else 1)
