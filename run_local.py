#!/usr/bin/env python3
"""
Naukri Profile Updater - LOCAL VERSION
Run this on your personal computer (not GitHub Actions)
Your residential IP won't be blocked by Naukri's WAF
"""

import os
import sys
import random
from datetime import datetime
from playwright.sync_api import sync_playwright

# Configuration - UPDATE THESE WITH YOUR CREDENTIALS
NAUKRI_EMAIL = "todkarsant@gmail.com"  # Your Naukri email
NAUKRI_PASSWORD = "YOUR_PASSWORD_HERE"  # Your Naukri password
HEADLINES_FILE = "cv-bank/headlines.txt"

def log(message):
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] {message}")

def get_random_headline():
    try:
        with open(HEADLINES_FILE, 'r', encoding='utf-8') as f:
            headlines = [line.strip() for line in f if line.strip()]
        return random.choice(headlines) if headlines else "Software Builder"
    except FileNotFoundError:
        log(f"Headlines file not found: {HEADLINES_FILE}")
        return "Software Builder"

def update_profile():
    log("=== NAUKRI PROFILE UPDATE (LOCAL) ===")
    log(f"Email: {NAUKRI_EMAIL}")
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)  # Visible browser for debugging
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080}
        )
        page = context.new_page()
        
        try:
            # Login
            log("\nGoing to Naukri login...")
            page.goto("https://www.naukri.com/login", wait_until="networkidle")
            page.wait_for_timeout(5000)
            
            # Fill credentials
            log("Filling credentials...")
            page.fill('input[name="USERNAME"]', NAUKRI_EMAIL)
            page.fill('input[type="password"]', NAUKRI_PASSWORD)
            
            # Click login
            page.click('button[type="submit"]')
            page.wait_for_timeout(10000)
            
            log("✓ Logged in")
            
            # Go to profile
            log("\nGoing to profile...")
            page.goto("https://www.naukri.com/mnjuser/profile", wait_until="networkidle")
            page.wait_for_timeout(10000)
            
            # Update headline
            headline = get_random_headline()
            log(f"Selected headline: \"{headline}\"")
            
            # Find and fill headline field
            headline_input = page.locator('input[placeholder*="headline" i], input[name*="headline" i]').first()
            if headline_input.is_visible():
                headline_input.fill(headline)
                log("✓ Headline updated")
                
                # Save
                save_btn = page.locator('button:has-text("Save"), input[value="Save"]').first()
                if save_btn.is_visible():
                    save_btn.click()
                    page.wait_for_timeout(3000)
                    log("✓ Saved")
            else:
                log("! Headline field not found")
            
            log("\n✓ COMPLETED!")
            
        except Exception as e:
            log(f"✗ Error: {e}")
            page.screenshot(path="error-screenshot.png")
            log("Screenshot saved to error-screenshot.png")
        
        finally:
            browser.close()

if __name__ == "__main__":
    # Install playwright if needed
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        log("Installing Playwright...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
    
    update_profile()
