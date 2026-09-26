#!/usr/bin/env python3
"""
Naukri Profile Updater - MOBILE API APPROACH
Uses Naukri's mobile API which has weaker security
"""

import os
import sys
import random
import requests
import json
from datetime import datetime

# Configuration
NAUKRI_EMAIL = os.getenv("NAUKRI_EMAIL", "todkarsant@gmail.com")
NAUKRI_PASSWORD = os.getenv("NAUKRI_PASSWORD")
HEADLINES_FILE = "cv-bank/headlines.txt"

# Mobile API endpoints
BASE_URL = "https://www.naukri.com"
LOGIN_URL = "https://www.naukri.com/nlogin/auth"
PROFILE_URL = "https://www.naukri.com/mnj/v1/user/profiles/me"
HEADLINE_URL = "https://www.naukri.com/mnj/v1/user/profiles/me/headline"

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
    log("=== NAUKRI PROFILE UPDATE (MOBILE API) ===")
    log(f"Email: {NAUKRI_EMAIL}")
    
    # Create session with mobile headers
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'NaukriAndroid/8.0.0 (Android 11; Mobile)',
        'X-App-Version': '8.0.0',
        'X-Platform': 'android',
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Language': 'en-US,en;q=0.9',
    })
    
    try:
        # Step 1: Login
        log("\n=== STEP 1: LOGIN ===")
        login_data = {
            'username': NAUKRI_EMAIL,
            'password': NAUKRI_PASSWORD,
            'deviceType': 'android',
            'appVersion': '8.0.0'
        }
        
        log("Sending login request...")
        response = session.post(LOGIN_URL, data=login_data, timeout=30)
        
        log(f"Login response status: {response.status_code}")
        
        # Check response
        if response.status_code == 200:
            try:
                result = response.json()
                log(f"Login response: {result}")
                
                if 'userId' in result or 'token' in result or 'authToken' in result:
                    log("✓ Login successful!")
                    
                    # Extract tokens if available
                    user_id = result.get('userId') or result.get('id')
                    auth_token = result.get('token') or result.get('authToken') or result.get('accessToken')
                    
                    if auth_token:
                        session.headers['Authorization'] = f'Bearer {auth_token}'
                        log(f"Got auth token: {auth_token[:20]}...")
                    
                    if user_id:
                        log(f"User ID: {user_id}")
                else:
                    log("✗ Login failed - no userId/token in response")
                    log(f"Response: {result}")
                    return False
                    
            except json.JSONDecodeError:
                log("✗ Login response not JSON")
                log(f"Response: {response.text[:200]}")
                return False
        else:
            log(f"✗ Login failed with status {response.status_code}")
            log(f"Response: {response.text[:200]}")
            return False
        
        # Step 2: Update Headline
        log("\n=== STEP 2: UPDATE HEADLINE ===")
        headline = get_random_headline()
        log(f"Selected headline: \"{headline}\"")
        
        try:
            # Try to update via API
            headline_data = {
                'headline': headline,
                'resumeHeadline': headline
            }
            
            # Try different endpoints
            endpoints = [
                f"{BASE_URL}/mnj/v1/user/profiles/me",
                f"{BASE_URL}/mnj/v1/user/profiles/me/headline",
                f"{BASE_URL}/profile/headline"
            ]
            
            for endpoint in endpoints:
                try:
                    log(f"Trying: {endpoint}")
                    response = session.put(endpoint, json=headline_data, timeout=30)
                    
                    if response.status_code in [200, 201, 204]:
                        log(f"✓ Headline updated successfully!")
                        log(f"Response: {response.text[:100]}")
                        return True
                    else:
                        log(f"✗ Status {response.status_code}")
                        
                except Exception as e:
                    log(f"✗ Endpoint failed: {e}")
                    continue
            
            log("✗ All endpoints failed")
            return False
            
        except Exception as e:
            log(f"✗ Headline update failed: {e}")
            return False
        
    except Exception as e:
        log(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = update_profile()
    sys.exit(0 if success else 1)
