#!/usr/bin/env python3
"""
Naukri Profile Updater - VPS Version with Proxy Support
Run this on a cloud VPS with a residential proxy to bypass WAF
"""

import os
import sys
import random
from datetime import datetime
from playwright.sync_api import sync_playwright

# Configuration - Set these as environment variables or edit here
NAUKRI_EMAIL = os.getenv("NAUKRI_EMAIL", "todkarsant@gmail.com")
NAUKRI_PASSWORD = os.getenv("NAUKRI_PASSWORD", "YOUR_PASSWORD_HERE")
HEADLINES_FILE = "cv-bank/headlines.txt"

# PROXY CONFIGURATION (REQUIRED for VPS)
# Get residential proxy from: Bright Data, Oxylabs, Smartproxy, etc.
PROXY_SERVER = os.getenv("PROXY_SERVER", "http://proxy.example.com:8080")  # e.g., "http://brd.superproxy.io:22225"
PROXY_USERNAME = os.getenv("PROXY_USERNAME", "your-proxy-username")
PROXY_PASSWORD = os.getenv("PROXY_PASSWORD", "your-proxy-password")

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
    log("=== NAUKRI PROFILE UPDATE (VPS + PROXY) ===")
    log(f"Email: {NAUKRI_EMAIL}")
    log(f"Proxy: {PROXY_SERVER}")
    
    with sync_playwright() as p:
        # Configure proxy
        proxy_config = {
            "server": PROXY_SERVER,
        }
        if PROXY_USERNAME and PROXY_PASSWORD:
            proxy_config["username"] = PROXY_USERNAME
            proxy_config["password"] = PROXY_PASSWORD
        
        # Launch browser with proxy
        browser = p.chromium.launch(
            headless=True,  # Headless for VPS
            proxy=proxy_config
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
            
            # Check if we got blocked
            if "Access Denied" in page.title() or "edgesuite" in page.content().lower():
                log("✗ BLOCKED BY WAF - Proxy may not be working")
                page.screenshot(path="blocked.png")
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
                page.screenshot(path="login-error.png")
                return False
            
            # Go to profile
            log("\nGoing to profile...")
            page.goto("https://www.naukri.com/mnjuser/profile", wait_until="networkidle", timeout=60000)
            page.wait_for_for_timeout(10000)
            
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
            
            page.screenshot(path="success.png")
            log("\n✓ COMPLETED!")
            return True
            
        except Exception as e:
            log(f"✗ Error: {e}")
            page.screenshot(path="error.png")
            return False
        
        finally:
            browser.close()

if __name__ == "__main__":
    # Auto-install playwright if needed
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        log("Installing Playwright...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
    
    success = update_profile()
    sys.exit(0 if success else 1)
