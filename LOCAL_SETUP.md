# 🖥️ Local Setup Instructions (RECOMMENDED)

Since GitHub Actions IPs are blocked by Naukri's WAF, **running this automation locally on your computer is the best solution**.

## Why Local Works Better

- ✅ Your residential IP (Bengaluru) won't be blocked
- ✅ No WAF/CDN restrictions
- ✅ Full browser automation works perfectly
- ✅ Easier to debug and customize

---

## Setup Steps

### Step 1: Clone or Download the Repository

```bash
# If you have git
git clone https://github.com/todkarsant/naukri-automation.git
cd naukri-automation

# OR download the ZIP from GitHub and extract it
```

### Step 2: Install Python 3.10+

Download from: https://www.python.org/downloads/

Verify installation:
```bash
python --version
# Should show: Python 3.10.x or higher
```

### Step 3: Install Dependencies

```bash
# Install Playwright
pip install playwright

# Install browsers
playwright install chromium
```

### Step 4: Configure Credentials

Edit `run_local.py` and update these lines:

```python
NAUKRI_EMAIL = "todkarsant@gmail.com"  # Your email
NAUKRI_PASSWORD = "YOUR_ACTUAL_PASSWORD"  # Your password
```

### Step 5: Add Your Resume Files (Optional)

Place your resume PDF files in:
```
cv-bank/resumes/
  ├── resume-backend.pdf
  ├── resume-fullstack.pdf
  └── resume-lead.pdf
```

### Step 6: Run the Script

```bash
python run_local.py
```

The browser will open and you'll see it automate the login and profile update!

---

## Schedule It to Run Automatically

### Windows (Task Scheduler)

1. Open **Task Scheduler** (search in Start menu)
2. Click **"Create Basic Task"**
3. Name: "Naukri Profile Update"
4. Trigger: **Daily** or **Weekly**
5. Action: **Start a program**
   - Program: `python.exe`
   - Arguments: `C:\path\to\naukri-automation\run_local.py`
   - Start in: `C:\path\to\naukri-automation`
6. Finish

To run multiple times a day:
- Create multiple tasks with different times (9 AM, 2 PM, 6 PM, etc.)

### macOS/Linux (Cron)

1. Open crontab:
```bash
crontab -e
```

2. Add these lines (runs at 9 AM, 2 PM, 6 PM daily):
```bash
0 9 * * * /usr/bin/python3 /path/to/naukri-automation/run_local.py
0 14 * * * /usr/bin/python3 /path/to/naukri-automation/run_local.py
0 18 * * * /usr/bin/python3 /path/to/naukri-automation/run_local.py
```

3. Save and exit

---

## Troubleshooting

### "Command not found: python"

- Windows: Use `py` instead of `python`
- Make sure Python is in your PATH

### Playwright Installation Failed

```bash
# Try this:
pip install --upgrade pip
pip install playwright
playwright install chromium
```

### Login Fails

- Check your credentials in `run_local.py`
- Make sure you can manually login at naukri.com
- Check if 2FA is enabled (not supported yet)

### "Headline field not found"

- Naukri may have changed their UI
- The script takes a screenshot on error - check `error-screenshot.png`
- You may need to update the selectors in the script

---

## Alternative: Use a VPS

If you want it running in the cloud (not on your laptop):

1. **Rent a VPS**: DigitalOcean Droplet ($5/month) or AWS EC2
2. **Install Python & Playwright** on the VPS
3. **Upload the script** via SCP or git clone
4. **Set up cron** on the VPS
5. **Use a proxy** if the VPS IP gets blocked

---

## Security Notes

- ⚠️ **Don't commit your password** to GitHub
- ✅ Store credentials only in `run_local.py` (add to .gitignore)
- ✅ Use a strong, unique password for Naukri
- ✅ Review the script before running

---

## What This Script Does

1. Opens Chromium browser (visible, not headless)
2. Goes to naukri.com/login
3. Fills your email and password
4. Clicks login
5. Navigates to your profile
6. Updates your resume headline (random from your list)
7. Takes screenshots for debugging

---

## Next Steps

Once running locally works:
1. Set up scheduled tasks (see above)
2. Customize the headlines in `cv-bank/headlines.txt`
3. Add your resume files
4. Monitor the logs to ensure it's working

**Questions?** Open an issue on GitHub or message me!

---

**Author**: Santosh Todkar  
**Location**: Bengaluru, Karnataka  
**Date**: September 2026
