#!/usr/bin/env python3
"""
Naukri Profile Updater using NopeRi API Client
Updates profile headline and uploads resume using Naukri's internal API
"""

import os
import sys
import random
import time
from datetime import datetime

# Try to import NopeRi client
try:
    from nope ri import NaukriClient
except ImportError:
    print("Installing NopeRi library...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "git+https://github.com/Traverser25/NopeRi.git"])
    from nope ri import NaukriClient

# Configuration from environment
NAUKRI_EMAIL = os.getenv("NAUKRI_EMAIL")
NAUKRI_PASSWORD = os.getenv("NAUKRI_PASSWORD")
RESUME_PATH = os.getenv("RESUME_PATH", "cv-bank/resumes")

# Headlines file
HEADLINES_FILE = "cv-bank/headlines.txt"

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
        log("\nInitializing NopeRi client...")
        client = NaukriClient(
            username=NAUKRI_EMAIL,
            password=NAUKRI_PASSWORD
        )
        
        log("✓ Client initialized successfully")
        
        # Get random headline
        headline = get_random_headline()
        log(f"\nSelected headline: \"{headline}\"")
        
        # Update profile headline
        log("\nUpdating profile headline...")
        try:
            client.update_profile(headline=headline)
            log("✓ Headline updated successfully")
        except Exception as e:
            log(f"✗ Headline update failed: {e}")
        
        # Get and upload resume
        resume_file = get_resume_file()
        if resume_file:
            log(f"\nUploading resume: {resume_file}")
            try:
                client.update_resume(resume_file)
                log("✓ Resume uploaded successfully")
            except Exception as e:
                log(f"✗ Resume upload failed: {e}")
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
