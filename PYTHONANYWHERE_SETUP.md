# 🐍 PythonAnywhere Setup (FREE, No Card)

**Best for Python scripts** - has built-in scheduler!

---

## What You Get (Free)

- ✅ **1 web app**
- ✅ **512 MB RAM**
- ✅ **1 CPU** (shared)
- ✅ **Built-in scheduler** (cron-like)
- ✅ **No credit card**
- ✅ **Always free**

---

## Limitations

- ⚠️ Limited CPU (but enough for scripts)
- ⚠️ Can only connect to whitelisted sites (Naukri.com IS whitelisted!)
- ⚠️ Datacenter IP (may be blocked)
- ⚠️ 1 web app only

---

## Step 1: Sign Up

1. Go to https://www.pythonanywhere.com/
2. Click "Sign Up"
3. Choose **"Beginner (free)"**
4. Sign up with email
5. **No credit card needed!**

---

## Step 2: Upload Files

1. **Dashboard** → "Files" tab
2. Click "Upload a file"
3. Upload these files from your repo:
   - `naukri_updater.py`
   - `requirements.txt`
   - `cv-bank/headlines.txt`

Or use Git:

```bash
# In PythonAnywhere console:
git clone https://github.com/todkarsant/naukri-automation.git
```

---

## Step 3: Install Dependencies

1. Go to "Consoles" tab
2. Click "Bash" (starts a console)
3. Run:

```bash
# Create virtual environment
mkvirtualenv naukri-env -p python3.10

# Activate it
workon naukri-env

# Install dependencies
pip install playwright requests
playwright install chromium
```

---

## Step 4: Configure Script

Edit `naukri_updater.py` and add at the top:

```python
# PythonAnywhere configuration
import sys
sys.path.insert(0, '/home/yourusername/naukri-automation')

# Your credentials
NAUKRI_EMAIL = "todkarsant@gmail.com"
NAUKRI_PASSWORD = "YOUR_PASSWORD_HERE"
```

Replace `yourusername` with your PythonAnywhere username.

---

## Step 5: Test Manually

In the Bash console:

```bash
# Activate environment
workon naukri-env

# Run script
python naukri_updater.py
```

Check output for success/errors.

---

## Step 6: Set Up Scheduler

1. Go to "Tasks" tab
2. Under "Scheduled tasks", click "Add a new task"
3. Choose **"Regular script"**

4. **Configure**:
   - **Virtualenv**: `naukri-env`
   - **Command**: `python /home/yourusername/naukri-automation/naukri_updater.py`

5. **Schedule**:
   - Run at: 9:00
   - Run at: 14:00
   - Run at: 18:00
   (or your preferred times)

6. Click "Save"

---

## Step 7: Monitor

1. **Tasks** tab → Click on your task
2. See last run time and result
3. Check logs for errors

---

## Cost

**Total**: $0 (completely free!)

---

## ⚠️ Important: Naukri.com is Whitelisted!

Good news: PythonAnywhere's free tier allows connections to:
- ✅ Naukri.com
- ✅ Most major websites
- ❌ Some sites are blocked

Naukri.com should work without issues!

---

## Troubleshooting

### "Access Denied" from Naukri

PythonAnywhere uses datacenter IPs. If blocked:

1. Try different PythonAnywhere datacenter
2. Use their paid tier (better IPs)
3. Get residential proxy

### Import Errors

```bash
# Make sure you're in virtualenv
workon naukri-env

# Reinstall dependencies
pip install -r requirements.txt
```

### Scheduler Not Running

- Check "Tasks" tab for last run time
- Free tier: 1 task per day
- Upgrade to paid for more frequent runs

---

## Next Steps

1. ✅ Sign up (3 min)
2. ✅ Upload files (5 min)
3. ✅ Install dependencies (10 min)
4. ✅ Test manually (5 min)
5. ✅ Set up scheduler (5 min)

**Total**: 30 minutes  
**Cost**: $0

---

**Author**: Santosh Todkar  
**Date**: September 2026
