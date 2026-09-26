# 🎨 Render.com Setup (FREE, No Credit Card)

**The LAST remaining truly free cloud platform** (as of 2026)

---

## ✅ What You Get FREE (Forever)

- **750 instance hours/month** (enough for 1 VM running 24/7)
- **512 MB RAM**
- **0.1 CPU** (shared)
- **No credit card required**
- **No expiration**
- **Hobby workspace** ($0/month)

---

## ⚠️ Limitations

- Services **spin down after 15 minutes** of inactivity
- Takes **~1 minute to wake up** on next request
- **No persistent storage** on free tier
- **No cron jobs** on free tier (need to use web service + external scheduler)

---

## Workaround for Automation

Since free tier doesn't support cron jobs, we'll use:

**Option A: External Cron Service (Free)**
- Use cron-job.org or similar to ping your Render service
- Service wakes up, runs script, goes back to sleep
- Completely free

**Option B: Keep Service Awake**
- Ping your service every 10 minutes
- Prevents spin-down
- Uses more of your 750 hours

---

## Step 1: Sign Up (No Card!)

1. Go to https://render.com/
2. Click "Get Started for Free"
3. Sign up with:
   - GitHub (recommended)
   - Google
   - Email
4. **No credit card required!**

---

## Step 2: Create New Web Service

1. **Dashboard** → Click "New" → "Web Service"

2. **Connect Repository**:
   - Choose your GitHub repo: `todkarsant/naukri-automation`
   - Or deploy from Git

3. **Configure**:
   - **Name**: `naukri-automation`
   - **Region**: Singapore (closest to India)
   - **Branch**: main
   - **Root Directory**: (leave blank)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python render_server.py`

4. **Choose Instance Type**:
   - Select **"Free"**
   - 512 MB RAM, 0.1 CPU

5. **Advanced**:
   - Add environment variables:
     ```
     NAUKRI_EMAIL=todkarsant@gmail.com
     NAUKRI_PASSWORD=YOUR_PASSWORD
     ```

6. Click **"Create Web Service"**

---
## Step 3: Create Render Server Script

Create `render_server.py`:

```python
#!/usr/bin/env python3
"""
Render.com server - runs Naukri updater on schedule
"""

import os
import sys
import time
from datetime import datetime
from flask import Flask, jsonify
import subprocess

app = Flask(__name__)

# Configuration
NAUKRI_EMAIL = os.getenv("NAUKRI_EMAIL", "todkarsant@gmail.com")
NAUKRI_PASSWORD = os.getenv("NAUKRI_PASSWORD")

def run_updater():
    """Run the Naukri updater script"""
    try:
        result = subprocess.run(
            ["python3", "vps_setup.py"],
            capture_output=True,
            text=True,
            timeout=300
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.route("/")
def home():
    return jsonify({
        "status": "running",
        "service": "Naukri Automation",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/health")
def health():
    return jsonify({"status": "healthy"})

@app.route("/run", methods=["POST", "GET"])
def run():
    """Trigger manual run"""
    log(f"Manual run triggered at {datetime.now()}")
    result = run_updater()
    return jsonify(result)

@app.route("/scheduled")
def scheduled():
    """Called by external cron service"""
    log(f"Scheduled run at {datetime.now()}")
    result = run_updater()
    return jsonify(result)

def log(message):
    print(f"[{datetime.now().isoformat()}] {message}", flush=True)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
```

---

## Step 4: Update requirements.txt

Add Flask:

```txt
playwright
requests
flask
```

---

## Step 5: Deploy

1. **Push to GitHub** (if not already)
2. **Render will auto-deploy** from your repo
3. Wait 5-10 minutes for first build
4. You'll get a URL like: `https://naukri-automation-xyz.onrender.com`

---

## Step 6: Set Up External Cron (Free)

### Option A: cron-job.org (Recommended)

1. Go to https://cron-job.org/
2. Sign up (free)
3. Create new cron job:
   - **URL**: `https://your-app.onrender.com/scheduled`
   - **Schedule**: Every 4 hours (or your preferred times)
   - **Method**: GET
4. Save

**Free tier**: 1000 executions/month (enough for 3x daily)

### Option B: UptimeRobot

1. Go to https://uptimerobot.com/
2. Create "monitor"
3. Set to ping every 5 minutes
4. Keeps service awake

**Free tier**: 50 monitors, 5-minute intervals

---

## Step 7: Test

```bash
# Test your service
curl https://your-app.onrender.com/

# Should return:
# {"status": "running", "service": "Naukri Automation", ...}
```

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| Render.com (Free tier) | $0 |
| cron-job.org (Free tier) | $0 |
| **Total** | **$0** |

---

## ⚠️ Important: IP May Still Be Blocked

Render uses **datacenter IPs**, which Naukri's WAF might block.

### Test First

```bash
# Trigger manual run
curl https://your-app.onrender.com/run

# Check logs in Render dashboard
# Look for "Access Denied" errors
```

**If blocked**: You'll need a proxy (not free) or different approach.

---

## Monitoring

### Render Dashboard

1. Go to your service in Render dashboard
2. Click "Logs" tab
3. See real-time logs

### Health Check

```bash
# Check if service is awake
curl https://your-app.onrender.com/health

# Should return: {"status": "healthy"}
```

---

## Troubleshooting

### Service Keeps Spinning Down

**Problem**: Free tier spins down after 15 min idle

**Solution A**: Use cron-job.org to ping every 10 minutes

**Solution B**: Accept the spin-down (1 min cold start is fine for hourly runs)

### Build Failed

```bash
# Check build logs in Render dashboard
# Common issues:
# - Missing requirements.txt
# - Wrong Python version
# - Syntax errors in code
```

### "Access Denied" from Naukri

Render's datacenter IP is blocked. Options:

1. Try without proxy (might work)
2. Get cheap proxy ($12/month)
3. Fall back to local laptop

### Out of Free Hours

Free tier: 750 hours/month

If exceeded:
- Service suspends until next month
- Or upgrade to Starter ($7/month)

---

## Alternative: Use Render for Testing Only

Since free tier has limitations, use Render to:

1. ✅ Test if script works in cloud
2. ✅ Verify Naukri login works
3. ✅ Debug issues

Then decide if worth paying $7/month for always-on service.

---

## Other Free Options (Backup Plans)

### 1. Vercel (Static Sites)
- Free static hosting
- Can run serverless functions
- No credit card
- Website: https://vercel.com/

### 2. Netlify
- Similar to Vercel
- Free serverless functions
- No credit card
- Website: https://netlify.com/

### 3. PythonAnywhere (Free Tier)
- Free Python hosting
- 1 web app
- Limited CPU
- Website: https://pythonanywhere.com/

---

## Next Steps

1. ✅ Sign up at Render.com (2 minutes)
2. ✅ Create web service (5 minutes)
3. ✅ Deploy your code (10 minutes)
4. ✅ Test with cron-job.org (5 minutes)
5. ✅ Monitor for 24 hours

**Total time**: ~30 minutes  
**Total cost**: $0 (if IP works)

---

**Author**: Santosh Todkar  
**Date**: September 2026  
**Status**: Render.com = FREE, No Card, but IP may be blocked
