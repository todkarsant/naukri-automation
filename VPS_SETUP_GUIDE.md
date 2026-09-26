# 🌐 VPS Setup Guide (Cloud Automation)

Run the automation on a cloud server 24/7 without keeping your laptop on.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Your VPS  │────▶│  Residential │────▶│   Naukri.com │
│ (DigitalOcean│     │    Proxy     │     │   (No Block) │
│   / AWS)    │     │  (Bright Data)│     │              │
└─────────────┘     └──────────────┘     └──────────────┘
```

---

## Step 1: Rent a VPS

### Option A: DigitalOcean Droplet (Recommended)

1. Go to https://www.digitalocean.com/
2. Sign up (free $200 credit for 60 days)
3. Create a Droplet:
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($5/month - 1GB RAM, 1 CPU)
   - **Region**: Choose closest to India (Singapore or Bangalore if available)
4. Note your server IP and SSH credentials

### Option B: AWS EC2 (Free Tier)

1. Go to https://aws.amazon.com/
2. Create free account
3. Launch EC2 instance:
   - **AMI**: Ubuntu 22.04
   - **Type**: t2.micro (free tier eligible)
   - **Region**: ap-south-1 (Mumbai)

### Option C: Google Cloud (Free Tier)

1. Go to https://cloud.google.com/
2. Create free account ($300 credit)
3. Create VM instance:
   - **OS**: Ubuntu 22.04
   - **Type**: e2-micro (free tier)

---

## Step 2: Get a Residential Proxy

**This is CRITICAL** - without a residential proxy, your VPS IP will also be blocked.

### Recommended Providers

#### 1. Bright Data (Best Quality)
- Website: https://brightdata.com/
- Product: "Residential Proxy"
- Cost: ~$15/GB (pay as you go)
- Sign up → Get proxy credentials

#### 2. Oxylabs
- Website: https://oxylabs.io/
- Product: "Residential Proxies"
- Cost: ~$15/GB
- Good for India IPs

#### 3. Smartproxy
- Website: https://smartproxy.com/
- Product: "Residential Proxy"
- Cost: ~$12/month (unlimited)
- Budget-friendly

#### 4. IPRoyal
- Website: https://iproyal.com/
- Product: "Residential Proxies"
- Cost: ~$8/month (unlimited)
- Cheapest option

### Get Your Proxy Details

After signing up, you'll get:
```
Proxy Server: brd.superproxy.io:22225 (example)
Username: your-username
Password: your-password
```

---

## Step 3: Connect to Your VPS

### Windows (PowerShell)
```powershell
ssh root@your-vps-ip
```

### macOS/Linux (Terminal)
```bash
ssh root@your-vps-ip
```

---

## Step 4: Install Dependencies on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.10+
sudo apt install -y python3 python3-pip python3-venv

# Install Playwright dependencies
sudo apt install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# Create project directory
mkdir naukri-automation
cd naukri-automation

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Playwright
pip install playwright
playwright install chromium

# Install cron scheduler
sudo apt install -y cron
```

---

## Step 5: Upload the Script

### Option A: Git Clone
```bash
cd ~/naukri-automation
git clone https://github.com/todkarsant/naukri-automation.git .
```

### Option B: SCP from Your Laptop
```bash
# From your laptop
scp -r /path/to/naukri-automation/* root@your-vps-ip:~/naukri-automation/
```

### Option C: Create File Manually
```bash
# Create the script
cat > vps_updater.py << 'EOF'
#!/usr/bin/env python3
# (paste the vps_setup.py content here)
EOF
```

---

## Step 6: Configure Environment Variables

```bash
# Create .env file
cat > .env << EOF
NAUKRI_EMAIL=todkarsant@gmail.com
NAUKRI_PASSWORD=YOUR_PASSWORD
PROXY_SERVER=http://your-proxy-server:port
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password
EOF

# Load environment variables
source .env
export NAUKRI_EMAIL NAUKRI_PASSWORD PROXY_SERVER PROXY_USERNAME PROXY_PASSWORD
```

---

## Step 7: Test the Script

```bash
# Run manually first
python3 vps_setup.py

# Check for success.png screenshot
ls -la *.png
```

If you see `success.png`, it worked! 🎉

---

## Step 8: Set Up Cron (Scheduled Tasks)

```bash
# Edit crontab
sudo crontab -e

# Add these lines (runs at 9 AM, 2 PM, 6 PM IST)
# Adjust times based on your VPS timezone
0 3 * * * cd /root/naukri-automation && source venv/bin/activate && source .env && python3 vps_setup.py >> logs/cron.log 2>&1
0 8 * * * cd /root/naukri-automation && source venv/bin/activate && source .env && python3 vps_setup.py >> logs/cron.log 2>&1
0 12 * * * cd /root/naukri-automation && source venv/bin/activate && source .env && python3 vps_setup.py >> logs/cron.log 2>&1

# Save and exit (Ctrl+X, Y, Enter)

# Create logs directory
mkdir -p logs

# Restart cron
sudo service cron restart

# Check cron status
sudo service cron status
```

---

## Step 9: Monitor

### Check Logs
```bash
# View recent logs
tail -f logs/cron.log

# View all logs
cat logs/cron.log

# Check screenshots
ls -la *.png
```

### Check Cron Jobs
```bash
# List all cron jobs
sudo crontab -l

# Check cron service
sudo systemctl status cron
```

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| DigitalOcean Droplet | $5/month |
| Bright Data Proxy (1GB) | $15 |
| **Total** | **~$20/month** |

**Note**: The script uses ~10-20MB per run, so 1GB lasts ~50-100 runs (plenty for 3x daily).

---

## Troubleshooting

### "Access Denied" Still Appears
- Your proxy may be datacenter, not residential
- Contact proxy provider for India residential IPs
- Try a different proxy provider

### Script Fails to Run
- Check Python version: `python3 --version`
- Reinstall Playwright: `playwright install chromium`
- Check logs: `cat logs/cron.log`

### Cron Not Running
- Check cron service: `sudo systemctl status cron`
- Check cron logs: `grep CRON /var/log/syslog`
- Ensure script has execute permission: `chmod +x vps_setup.py`

### Proxy Too Slow
- Try a different proxy server/location
- Increase timeout in script
- Contact proxy provider

---

## Alternative: Serverless (Advanced)

If you don't want to manage a VPS:

### AWS Lambda + API Gateway
- Runs on schedule (CloudWatch Events)
- Pay per execution (~$1-2/month)
- More complex to set up
- Need Lambda layers for Playwright

### Google Cloud Functions
- Similar to Lambda
- Scheduled triggers
- ~$2-3/month

**I recommend VPS for simplicity** - easier to debug and maintain.

---

## Security Notes

- 🔒 Use strong passwords
- 🔒 Enable VPS firewall (UFW)
- 🔒 Don't commit `.env` to Git
- 🔒 Use SSH keys instead of passwords
- 🔒 Regular system updates: `sudo apt update && sudo apt upgrade`

---

## Next Steps

1. ✅ Set up VPS
2. ✅ Get residential proxy
3. ✅ Test script manually
4. ✅ Configure cron
5. ✅ Monitor for 2-3 days
6. ✅ Adjust schedule as needed

---

**Questions?** Check the logs or contact proxy provider support.

**Author**: Santosh Todkar  
**Date**: September 2026
