# 🪰 Fly.io Setup (NO Credit Card Required)

**Free cloud VMs without credit card** - runs 24/7

---

## What You Get (Free Tier)

- ✅ **3 free VMs** (shared-cpu-1x)
- ✅ **3GB RAM total** (1GB per VM)
- ✅ **160GB outbound transfer**
- ✅ **No credit card required** for basic tier
- ✅ **Always free** (no expiration)

---

## Limitations

- ⚠️ **1 shared CPU** (slower than Oracle Cloud)
- ⚠️ **1GB RAM** per VM (enough for this script)
- ⚠️ **Datacenter IP** (may be blocked by Naukri)
- ⚠️ **Limited to 3 VMs**

---

## Step 1: Sign Up (No Card!)

1. Go to https://fly.io/app/sign-up

2. Choose signup method:
   - **GitHub** (recommended - easiest)
   - Google
   - Email

3. **No credit card required!** Just verify your email

4. You'll get:
   - API token
   - Access to free tier

---

## Step 2: Install Fly.io CLI

### Windows (PowerShell)
```powershell
# Install via winget
winget install fly-io.flyctl

# OR download from: https://github.com/superfly/flyctl/releases
```

### macOS (Terminal)
```bash
# Install via Homebrew
brew install flyctl
```

### Linux (Terminal)
```bash
# Install
curl -L https://fly.io/install.sh | sh

# Add to PATH
export PATH="$HOME/.fly/bin:$PATH"
```

### Verify Installation
```bash
fly version
# Should show version number
```

---

## Step 3: Authenticate

```bash
# Login with GitHub (recommended)
fly auth login

# This will open browser for GitHub OAuth
# Or use token from dashboard:
fly auth token
```

---

## Step 4: Create Your App

```bash
# Create new app
fly launch --name naukri-automation

# When prompted:
# - Create a new app? → Yes
# - App name → naukri-automation
# - Select region → sin (Singapore, closest to India)
# - Deploy? → No (we'll configure first)
```

---

## Step 5: Configure the App

Create `fly.toml` file:

```bash
# Edit fly.toml
nano fly.toml
```

Replace content with:

```toml
app = "naukri-automation"
primary_region = "sin"

[build]
  image = "python:3.11-slim"

[deploy]
  strategy = "immediate"

[[services]]
  protocol = "tcp"
  internal_port = 8080
  auto_stop_machines = false
  auto_start_machines = true

[env]
  NAUKRI_EMAIL = "todkarsant@gmail.com"
  NAUKRI_PASSWORD = "YOUR_PASSWORD_HERE"
  # Leave PROXY empty to try without (free)
  PROXY_SERVER = ""
  PROXY_USERNAME = ""
  PROXY_PASSWORD = ""
```

---

## Step 6: Create Dockerfile

Create `Dockerfile` in project root:

```bash
nano Dockerfile
```

Content:

```dockerfile
FROM python:3.11-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    cron \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Install Playwright browsers
RUN playwright install chromium

# Set up cron
RUN chmod +x run_cron.sh
RUN (crontab -l 2>/dev/null; echo "0 3 * * * cd /app && source venv/bin/activate && python3 vps_setup.py >> logs/cron.log 2>&1") | crontab -
RUN (crontab -l 2>/dev/null; echo "0 8 * * * cd /app && source venv/bin/activate && python3 vps_setup.py >> logs/cron.log 2>&1") | crontab -
RUN (crontab -l 2>/dev/null; echo "0 12 * * * cd /app && source venv/bin/activate && python3 vps_setup.py >> logs/cron.log 2>&1") | crontab -

# Start cron
CMD ["cron", "-f"]
```

---

## Step 7: Create Startup Script

Create `run_cron.sh`:

```bash
nano run_cron.sh
```

Content:

```bash
#!/bin/bash

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create logs directory
mkdir -p logs

# Start cron in foreground
exec cron -f
```

Make executable:
```bash
chmod +x run_cron.sh
```

---

## Step 8: Update requirements.txt

```bash
nano requirements.txt
```

Content:
```txt
playwright
requests
```

---

## Step 9: Deploy to Fly.io

```bash
# Deploy
fly deploy

# This will:
# - Build Docker image
# - Push to Fly.io
# - Start your VM
```

**First deploy takes 5-10 minutes** (building image)

---

## Step 10: Verify It's Running

```bash
# Check app status
fly status

# View logs
fly logs

# SSH into VM (for debugging)
fly ssh console
```

---

## Step 11: Monitor

```bash
# Real-time logs
fly logs --app naukri-automation

# Check if cron is running
fly ssh console
# Then inside VM:
ps aux | grep cron
cat /app/logs/cron.log
```

---

## Cost

| Service | Cost |
|---------|------|
| Fly.io (3 VMs free tier) | **$0** |
| Residential Proxy (optional) | $0-15/month |
| **Total** | **$0-15/month** |

---

## ⚠️ Important: Fly.io IP May Be Blocked

Fly.io uses **datacenter IPs**, which Naukri's WAF might block.

### Test First

```bash
# Check logs
fly logs

# If you see "Access Denied" in logs:
# - IP is blocked
# - Need proxy (not free)
# - Or try different approach
```

---

## Troubleshooting

### "Access Denied" from Naukri

Fly.io datacenter IPs may be blocked. Options:

1. **Try without proxy** - sometimes works
2. **Get cheap proxy** - $12/month
3. **Try different Fly.io region** - some regions less blocked

### App Keeps Stopping

By default, Fly.io stops inactive apps. We disabled this in `fly.toml` with:
```toml
auto_stop_machines = false
auto_start_machines = true
```

### Deployment Failed

```bash
# Check what went wrong
fly logs --app naukri-automation

# Rebuild and redeploy
fly deploy --no-cache
```

### Out of Free Allowance

Free tier: 3 VMs, 3GB RAM, 160GB transfer

If you exceed:
- Delete unused apps: `fly apps destroy appname`
- Or pay for extra (~$2-5/month for minimal usage)

---

## Alternative: Run on Schedule (Not 24/7)

To save resources, run only at specific times:

Create `start.sh`:
```bash
#!/bin/bash
python3 vps_setup.py
fly machines stop $FLY_MACHINE_ID
```

Schedule this to:
1. Start VM
2. Run script
3. Stop VM

More complex but uses fewer resources.

---

## Other No-Card Cloud Options

### 1. Render.com
- Free web services
- No card needed
- But services sleep after inactivity
- Website: https://render.com/

### 2. Railway.app
- $5 free credit/month
- No card initially
- Eventually need card
- Website: https://railway.app/

### 3. Hugging Face Spaces
- Free CPU instances
- No card
- Designed for ML, but can run scripts
- Website: https://huggingface.co/spaces

---

## Next Steps

1. ✅ Sign up at Fly.io (2 minutes, no card)
2. ✅ Install flyctl CLI (5 minutes)
3. ✅ Deploy the app (10 minutes)
4. ✅ Test if it works (5 minutes)
5. ✅ Monitor logs for 24 hours

**Total time**: ~30 minutes  
**Total cost**: $0 (if IP works) or $12-15/month (if proxy needed)

---

**Author**: Santosh Todkar  
**Date**: September 2026  
**Status**: Fly.io = Free, No Card, but IP may be blocked
