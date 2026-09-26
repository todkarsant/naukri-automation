#!/usr/bin/env python3
"""
Naukri Profile Updater - BROWSER VERSION
Uses Playwright to automate actual browser login
"""

import os
import sys
import random
from datetime import datetime
from playwright.sync_api import sync_playwright

# Configuration
NAUKRI_EMAIL = os.getenv("NAUKRI_EMAIL", "todkarsant@gmail.com")
NAUKRI_PASSWORD = os.getenv("NAUKRI_PASSWORD")
HEADLINES_FILE = "cv-bank/headlines.txt"

def log(message):
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] {message}")

def get_random_headline():
    try:
        with open(HEADLINES_FILE, 'r', encoding='utf-8') as f:
            headlines = [line.strip() for line in f if line.strip()]
        return random.choice(headlines) if headlines else "Software Builder"
    except:
        return "Software Builder"

def update_profile():
    log("=== NAUKRI PROFILE UPDATE (BROWSER) ===")
    log(f"Email: {NAUKRI_EMAIL}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()
        
        try:
            # Login
            log("\nGoing to Naukri login...")
            page.goto("https://www.naukri.com/login", wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(8000)
            
            # Check if blocked
            if "Access Denied" in page.title():
                log("✗ BLOCKED BY WAF!")
                return False
            
            # Fill credentials
            log("Filling credentials...")
            try:
                page.fill('input[name="USERNAME"]', NAUKRI_EMAIL)
                page.fill('input[type="password"]', NAUKRI_PASSWORD)
                page.click('button[type="submit"]')
                page.wait_for_timeout(15000)
                log("✓ Login submitted")
            except Exception as e:
                log(f"✗ Login failed: {e}")
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
            return True
            
        except Exception as e:
            log(f"✗ Error: {e}")
            return False
        
        finally:
            browser.close()

if __name__ == "__main__":
    success = update_profile()
    sys.exit(0 if success else 1)
