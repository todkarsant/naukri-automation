# 🆓 Oracle Cloud Free Tier Setup

**Completely free** cloud server that runs 24/7

---

## What You Get (Always Free)

- **4 OCPU** (ARM-based Ampere A1)
- **24 GB RAM** (very generous!)
- **200 GB storage**
- **Public IP address**
- **No expiration** (unlike AWS free tier)

---

## Step 1: Sign Up

1. Go to https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Sign up with:
   - Email address
   - Phone number (for SMS verification)
   - Credit/Debit card (for identity verification, **NOT charged**)
4. Wait for approval (usually instant, sometimes takes 24 hours)

**Important**: Use a real phone number and card - Oracle verifies identity to prevent abuse.

---

## Step 2: Create Your VM

1. **Login** to Oracle Cloud Console: https://cloud.oracle.com/

2. **Navigate** to Compute:
   - Click hamburger menu (☰)
   - Compute → Instances

3. **Create Instance**:
   - Click "Create instance"
   - **Name**: `naukri-automation`
   - **Compartment**: Select your compartment
   - **Availability domain**: Choose any
   - **Image**: Ubuntu 22.04
   - **Shape**: VM.Standard.A1.Flex (ARM)
   - **OCPUs**: 4
   - **Memory**: 24 GB
   - **Networking**: 
     - Check "Assign a public IPv4 address"
     - Select your VCN (default is fine)
   - **SSH keys**:
     - Click "Generate a key pair for me"
     - Download private key (save securely!)
     - Or upload your own SSH public key
   - **Boot volume**: Keep default (50GB)

4. **Click "Create"**

5. **Wait** 2-3 minutes for VM to provision

6. **Note** your VM's public IP address

---

## Step 3: Connect to Your VM

### Windows (PowerShell)
```powershell
# Navigate to where you saved the key
cd Downloads

# Connect (replace with your IP and key name)
ssh -i opc_key.pem opc@your-vm-ip
```

### macOS/Linux (Terminal)
```bash
# Set key permissions
chmod 400 ~/Downloads/opc_key.pem

# Connect
ssh -i ~/Downloads/opc_key.pem opc@your-vm-ip
```

**First time?** You'll see a warning - type `yes` to continue.

---

## Step 4: Install Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.10+
sudo apt install -y python3 python3-pip python3-venv

# Install Playwright dependencies
sudo apt install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# Install git
sudo apt install -y git

# Create project directory
mkdir naukri-automation
cd naukri-automation

# Clone your repo
git clone https://github.com/todkarsant/naukri-automation.git .

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Playwright
pip install playwright
playwright install chromium
```

---

## Step 5: Configure the Script

```bash
# Edit the script with your credentials
nano vps_setup.py

# Update these lines:
NAUKRI_EMAIL = "todkarsant@gmail.com"
NAUKRI_PASSWORD = "YOUR_PASSWORD_HERE"

# For Oracle Cloud, try WITHOUT proxy first (it's free, might work)
# If blocked, you'll need to get a proxy
PROXY_SERVER = ""  # Leave empty to try without proxy
PROXY_USERNAME = ""
PROXY_PASSWORD = ""

# Save: Ctrl+X, Y, Enter
```

---

## Step 6: Test It

```bash
# Run manually
python3 vps_setup.py

# Check for success
ls -la *.png

# If you see success.png, it worked!
```

---

## Step 7: Set Up Automation (Cron)

```bash
# Edit crontab
sudo crontab -e

# Add these lines (runs at 9 AM, 2 PM, 6 PM IST)
# Oracle Cloud uses UTC by default, so adjust for IST (UTC+5:30)
30 3 * * * cd /home/opc/naukri-automation && source venv/bin/activate && python3 vps_setup.py >> logs/cron.log 2>&1
0 8 * * * cd /home/opc/naukri-automation && source venv/bin/activate && python3 vps_setup.py >> logs/cron.log 2>&1
30 12 * * * cd /home/opc/naukri-automation && source venv/bin/activate && python3 vps_setup.py >> logs/cron.log 2>&1

# Save: Ctrl+X, Y, Enter

# Create logs directory
mkdir -p logs

# Restart cron
sudo service cron restart
```

---

## Step 8: Monitor

```bash
# Check if cron is running
sudo systemctl status cron

# View logs
tail -f logs/cron.log

# Check screenshots
ls -la *.png
```

---

## ⚠️ Important: Oracle Cloud IP May Be Blocked

Oracle Cloud uses **datacenter IPs**, which Naukri's WAF might block.

### Test First

Run the script manually:
```bash
python3 vps_setup.py
```

**If it works** (you see `success.png`): 🎉 Great! Continue with cron.

**If blocked** ("Access Denied"): You have 2 options:

#### Option A: Get a Free Proxy (Limited)

Try free proxy services (unreliable):
- https://www.proxy-list.download/
- https://free-proxy-list.net/

Update `vps_setup.py` with free proxy details (may not work).

#### Option B: Use Your Home IP as Proxy (Advanced)

Set up a proxy on your home computer and route Oracle Cloud traffic through it.

**On your laptop** (when it's on):
```bash
# Install proxy
sudo apt install squid

# Configure squid.conf to allow your Oracle Cloud IP
# Restart squid
sudo systemctl restart squid
```

**On Oracle Cloud**:
```python
# In vps_setup.py
PROXY_SERVER = "http://your-home-ip:3128"
```

**Downside**: Your laptop needs to be on for this to work.

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| Oracle Cloud VM | **FREE** (always free tier) |
| Residential Proxy | $0-15/month (optional, if needed) |
| **Total** | **$0-15/month** |

---

## Troubleshooting

### "Access Denied" from Naukri

Oracle's datacenter IPs are also blocked. Your options:

1. **Try without proxy** - sometimes works
2. **Get a cheap proxy** - $12/month (Smartproxy)
3. **Use free proxies** - unreliable but free
4. **Fall back to local** - run from your laptop

### SSH Connection Failed

```bash
# Check security list in Oracle Cloud Console
# Ensure port 22 (SSH) is open
# Check your key permissions
chmod 400 your-key.pem
```

### VM Stopped

Oracle Cloud free tier VMs can be stopped if resources are needed.

```bash
# Check VM status in Oracle Cloud Console
# Restart if needed
```

### Python/Playwright Errors

```bash
# Reinstall Playwright
pip uninstall playwright
pip install playwright
playwright install chromium

# Check Python version
python3 --version  # Should be 3.10+
```

---

## Alternative Free Cloud Options

### 1. Google Cloud Free Tier

- 1 e2-micro instance (0.25 vCPU, 1GB RAM)
- 30 GB storage
- Free for 1 month, then ~$5/month
- Sign up: https://cloud.google.com/free

### 2. AWS Free Tier

- t2.micro or t3.micro (1 vCPU, 1GB RAM)
- 750 hours/month for 12 months
- Then ~$8-10/month
- Sign up: https://aws.amazon.com/free

### 3. Fly.io (Developer-Friendly)

- 3 shared-cpu-1x VMs free
- 3GB RAM total
- 160GB outbound transfer
- Sign up: https://fly.io/

**Note**: All of these use datacenter IPs, so may also be blocked by Naukri.

---

## Realistic Expectations

**Best case**: Oracle Cloud IP works without proxy → **100% free**

**Likely case**: Need a cheap proxy → **$12-15/month**

**Worst case**: All cloud IPs blocked → Fall back to local laptop

---

## Next Steps

1. ✅ Sign up for Oracle Cloud Free Tier
2. ✅ Create your VM (10 minutes)
3. ✅ Deploy the script (15 minutes)
4. ✅ Test if it works without proxy
5. ✅ If blocked, decide: get proxy or use local

**Questions?** Oracle Cloud support is helpful, or ask me!

---

**Author**: Santosh Todkar  
**Date**: September 2026  
**Status**: Oracle Cloud = Free, but IP may be blocked by Naukri
