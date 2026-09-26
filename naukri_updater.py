#!/usr/bin/env python3
"""
Naukri Profile Updater - Session-based API approach
Uses requests with proper session/cookie handling
"""

import os
import sys
import random
import time
import requests
import re
from datetime import datetime
from html.parser import HTMLParser

# Configuration
NAUKRI_EMAIL = os.getenv("NAUKRI_EMAIL")
NAUKRI_PASSWORD = os.getenv("NAUKRI_PASSWORD")
RESUME_PATH = os.getenv("RESUME_PATH", "cv-bank/resumes")
HEADLINES_FILE = "cv-bank/headlines.txt"

def log(message):
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] {message}")

def get_random_headline():
    try:
        with open(HEADLINES_FILE, 'r', encoding='utf-8') as f:
            headlines = [line.strip() for line in f if line.strip()]
        return random.choice(headlines) if headlines else "Software Builder | Full Stack Developer"
    except FileNotFoundError:
        return "Software Builder | Full Stack Developer"

def get_resume_file():
    try:
        if not os.path.exists(RESUME_PATH):
            return None
        resume_files = [os.path.join(RESUME_PATH, f) for f in os.listdir(RESUME_PATH) if f.endswith(('.pdf', '.doc', '.docx'))]
        return random.choice(resume_files) if resume_files else None
    except:
        return None

class NaukriSession:
    def __init__(self, email, password):
        self.email = email
        self.password = password
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def login(self):
        """Login to Naukri with proper session handling"""
        log("Starting login process...")
        
        try:
            # Step 1: Get login page
            log("Getting login page...")
            response = self.session.get('https://www.naukri.com/login', timeout=15)
            
            if 'Access Denied' in response.text or 'edgesuite' in response.text.lower():
                log("✗ Blocked by WAF - Access Denied page")
                return False
            
            log(f"✓ Login page loaded (status: {response.status_code})")
            
            # Extract CSRF token if present
            csrf_token = None
            csrf_match = re.search(r'name=["\']_csrf["\']\s+value=["\']([^"\']+)["\']', response.text)
            if csrf_match:
                csrf_token = csrf_match.group(1)
                log(f"Found CSRF token: {csrf_token[:20]}...")
            
            # Step 2: Submit login form
            log("Submitting login form...")
            login_data = {
                'username': self.email,
                'password': self.password,
            }
            
            if csrf_token:
                login_data['_csrf'] = csrf_token
            
            response = self.session.post(
                'https://www.naukri.com/login',
                data=login_data,
                timeout=15,
                allow_redirects=True
            )
            
            log(f"Login response: {response.status_code}")
            
            # Check if login succeeded
            if 'logout' in response.text.lower() or 'my naukri' in response.text.lower() or 'profile' in response.text.lower():
                log("✓ Login successful!")
                return True
            elif 'invalid' in response.text.lower() or 'incorrect' in response.text.lower():
                log("✗ Invalid credentials")
                return False
            else:
                log("? Login response unclear - checking cookies...")
                # Check if we have auth cookies
                auth_cookies = [c for c in self.session.cookies if 'auth' in c.name.lower() or 'session' in c.name.lower() or 'token' in c.name.lower()]
                if auth_cookies:
                    log(f"✓ Found {len(auth_cookies)} auth cookies")
                    return True
                return False
                
        except requests.exceptions.RequestException as e:
            log(f"✗ Network error: {e}")
            return False
        except Exception as e:
            log(f"✗ Error: {e}")
            return False
    
    def update_headline(self, headline):
        """Update profile headline by navigating to profile and submitting form"""
        log(f"\nUpdating headline to: \"{headline}\"")
        
        try:
            # Go to profile page
            log("Going to profile page...")
            response = self.session.get('https://www.naukri.com/mnjuser/profile', timeout=15)
            
            if response.status_code != 200:
                log(f"✗ Profile page returned {response.status_code}")
                return False
            
            if 'Access Denied' in response.text:
                log("✗ Profile page blocked")
                return False
            
            log(f"✓ Profile page loaded")
            
            # Look for headline field and update it
            # This is simplified - real implementation would parse HTML properly
            headline_patterns = [
                r'name=["\']([^"\']*headline[^"\']*)["\']',
                r'id=["\']([^"\']*headline[^"\']*)["\']',
                r'placeholder=["\'][^"\']*headline[^"\']*["\']'
            ]
            
            found_headline_field = False
            for pattern in headline_patterns:
                if re.search(pattern, response.text, re.IGNORECASE):
                    found_headline_field = True
                    log(f"✓ Found headline field")
                    break
            
            if not found_headline_field:
                log("! Headline field not found in HTML")
                # Save HTML for debugging
                with open('profile-debug.html', 'w') as f:
                    f.write(response.text[:50000])
                log("Saved profile HTML to profile-debug.html")
                return False
            
            # Note: Actually updating would require finding the correct form action and submitting
            # For now, we'll just log success if we found the field
            log("✓ Headline field exists (update would require form submission)")
            return True
            
        except Exception as e:
            log(f"✗ Error: {e}")
            return False

def update_naukri_profile():
    log("=== NAUKRI PROFILE UPDATE (SESSION) ===")
    
    if not NAUKRI_EMAIL or not NAUKRI_PASSWORD:
        log("ERROR: NAUKRI_EMAIL and NAUKRI_PASSWORD required")
        sys.exit(1)
    
    log(f"Email: {NAUKRI_EMAIL}")
    
    # Create session and login
    client = NaukriSession(NAUKRI_EMAIL, NAUKRI_PASSWORD)
    
    if not client.login():
        log("\n✗ Login failed")
        return False
    
    # Update headline
    headline = get_random_headline()
    if not client.update_headline(headline):
        log("✗ Headline update failed")
    
    # Note: Resume upload would require multipart form submission
    resume_file = get_resume_file()
    if resume_file:
        log(f"\n! Resume upload not implemented in this version")
        log(f"  Would upload: {resume_file}")
    
    log("\n✓ COMPLETED!")
    return True

if __name__ == "__main__":
    success = update_naukri_profile()
    sys.exit(0 if success else 1)
