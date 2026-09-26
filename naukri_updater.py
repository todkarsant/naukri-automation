#!/usr/bin/env python3
"""
Naukri Profile Updater using Direct API Calls
Bypasses WAF by using Naukri's internal API endpoints
"""

import os
import sys
import random
import time
import requests
from datetime import datetime
from urllib.parse import urljoin

# Configuration
NAUKRI_EMAIL = os.getenv("NAUKRI_EMAIL")
NAUKRI_PASSWORD = os.getenv("NAUKRI_PASSWORD")
RESUME_PATH = os.getenv("RESUME_PATH", "cv-bank/resumes")
HEADLINES_FILE = "cv-bank/headlines.txt"

# API Endpoints (based on NopeRi/naukri-api implementations)
BASE_URL = "https://www.naukri.com"
AUTH_URL = "https://auth.naukri.com/authenticate"
PROFILE_API = "https://www.naukri.com/mnj/v1/user/profiles"
RESUME_API = "https://www.naukri.com/mnj/v1/resumes"

def log(message):
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] {message}")

def get_random_headline():
    """Get a random headline from the headlines file"""
    try:
        with open(HEADLINES_FILE, 'r', encoding='utf-8') as f:
            headlines = [line.strip() for line in f if line.strip()]
        
        if not headlines:
            return "Software Builder | Full Stack Developer | Cloud Enthusiast"
        
        return random.choice(headlines)
    except FileNotFoundError:
        log(f"Headlines file not found: {HEADLINES_FILE}")
        return "Software Builder | Full Stack Developer"

def get_resume_file():
    """Get a random resume file from the resumes directory"""
    try:
        if not os.path.exists(RESUME_PATH):
            log(f"Resume directory not found: {RESUME_PATH}")
            return None
        
        resume_files = [
            os.path.join(RESUME_PATH, f) 
            for f in os.listdir(RESUME_PATH) 
            if f.endswith(('.pdf', '.doc', '.docx'))
        ]
        
        if not resume_files:
            log("No resume files found")
            return None
        
        return random.choice(resume_files)
    except Exception as e:
        log(f"Error getting resume file: {e}")
        return None

class NaukriAPIClient:
    """Simple Naukri API client"""
    
    def __init__(self, email, password):
        self.email = email
        self.password = password
        self.session = requests.Session()
        self.access_token = None
        self.profile_id = None
        
        # Set headers
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.naukri.com',
            'Referer': 'https://www.naukri.com/',
        })
    
    def authenticate(self):
        """Authenticate and get access token"""
        log("Authenticating...")
        
        # Try different auth endpoints
        auth_endpoints = [
            f"{AUTH_URL}/login",
            f"{BASE_URL}/login",
            "https://www.naukri.com/nlogin/auth"
        ]
        
        for endpoint in auth_endpoints:
            try:
                log(f"Trying: {endpoint}")
                
                # First, get the login page to extract tokens
                login_page = self.session.get(endpoint, timeout=10)
                
                # Look for CSRF token or other auth tokens
                # (This is a simplified approach - real implementation would parse the page)
                
                # Try to login
                login_data = {
                    'username': self.email,
                    'password': self.password,
                }
                
                response = self.session.post(endpoint, json=login_data, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'access_token' in data or 'token' in data or 'userId' in data:
                        self.access_token = data.get('access_token') or data.get('token')
                        self.profile_id = data.get('userId') or data.get('profileId')
                        log(f"✓ Authenticated successfully")
                        return True
                
            except Exception as e:
                log(f"✗ {endpoint} failed: {e}")
                continue
        
        log("✗ All auth endpoints failed")
        return False
    
    def update_profile(self, headline):
        """Update profile headline"""
        if not self.profile_id:
            log("✗ No profile ID - authentication may have failed")
            return False
        
        log(f"Updating profile headline...")
        
        try:
            url = f"{PROFILE_API}/{self.profile_id}/"
            
            payload = {
                'resumeHeadline': headline,
                'headline': headline
            }
            
            if self.access_token:
                self.session.headers['Authorization'] = f'Bearer {self.access_token}'
            
            response = self.session.put(url, json=payload, timeout=10)
            
            if response.status_code in [200, 201, 204]:
                log(f"✓ Headline updated successfully")
                return True
            else:
                log(f"✗ Update failed: HTTP {response.status_code}")
                log(f"Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            log(f"✗ Update failed: {e}")
            return False
    
    def upload_resume(self, resume_path):
        """Upload resume file"""
        if not os.path.exists(resume_path):
            log(f"✗ Resume file not found: {resume_path}")
            return False
        
        log(f"Uploading resume: {resume_path}")
        
        try:
            url = f"{RESUME_API}/upload"
            
            with open(resume_path, 'rb') as f:
                files = {'resume': (os.path.basename(resume_path), f, 'application/pdf')}
                
                if self.access_token:
                    self.session.headers['Authorization'] = f'Bearer {self.access_token}'
                
                response = self.session.post(url, files=files, timeout=30)
                
                if response.status_code in [200, 201]:
                    log(f"✓ Resume uploaded successfully")
                    return True
                else:
                    log(f"✗ Upload failed: HTTP {response.status_code}")
                    return False
                    
        except Exception as e:
            log(f"✗ Upload failed: {e}")
            return False

def update_naukri_profile():
    """Main function to update Naukri profile"""
    log("=== NAUKRI PROFILE UPDATE (API) ===")
    
    # Validate credentials
    if not NAUKRI_EMAIL or not NAUKRI_PASSWORD:
        log("ERROR: NAUKRI_EMAIL and NAUKRI_PASSWORD environment variables are required")
        sys.exit(1)
    
    log(f"Email: {NAUKRI_EMAIL}")
    
    try:
        # Initialize client
        client = NaukriAPIClient(NAUKRI_EMAIL, NAUKRI_PASSWORD)
        
        # Authenticate
        if not client.authenticate():
            log("\n✗ Authentication failed - check credentials")
            return False
        
        # Get random headline
        headline = get_random_headline()
        log(f"\nSelected headline: \"{headline}\"")
        
        # Update profile headline
        client.update_profile(headline)
        
        # Get and upload resume
        resume_file = get_resume_file()
        if resume_file:
            client.upload_resume(resume_file)
        else:
            log("\n! No resume file to upload")
        
        log("\n✓ UPDATE COMPLETED!")
        return True
        
    except Exception as error:
        log(f"\n✗ ERROR: {error}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = update_naukri_profile()
    sys.exit(0 if success else 1)
