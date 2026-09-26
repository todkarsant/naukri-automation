# 🤗 Hugging Face Spaces Setup (FREE, No Card)

**Most generous free resources** - 2 vCPU, 16GB RAM!

---

## What You Get (Free)

- ✅ **2 vCPU** (very powerful!)
- ✅ **16 GB RAM** (way more than needed)
- ✅ **No credit card**
- ✅ **Always free**
- ✅ **No sleep** (runs 24/7)

---

## Limitations

- ⚠️ Designed for ML demos (but can run scripts)
- ⚠️ No built-in scheduler (need external trigger)
- ⚠️ Public by default (but can make private)
- ⚠️ Datacenter IP (may be blocked by Naukri)

---

## Step 1: Sign Up

1. Go to https://huggingface.co/join
2. Sign up with GitHub (recommended) or email
3. **No credit card needed**

---

## Step 2: Create New Space

1. Click your profile → "New Space"

2. **Configure**:
   - **Space name**: `naukri-automation`
   - **License**: MIT
   - **Space SDK**: Docker
   - **Visibility**: Public (or Private if you prefer)

3. Click **"Create Space"**

---

## Step 3: Create Dockerfile

In your Space, create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    git cron && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone your repo
RUN git clone https://github.com/todkarsant/naukri-automation.git .

# Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright
RUN playwright install chromium

# Set environment variables
ENV NAUKRI_EMAIL="todkarsant@gmail.com"
ENV NAUKRI_PASSWORD="YOUR_PASSWORD_HERE"

# Create startup script
RUN echo '#!/bin/bash' > start.sh
RUN echo 'while true; do' >> start.sh
RUN echo '  python3 naukri_updater.py >> logs.txt 2>&1' >> start.sh
RUN echo '  sleep 21600  # Run every 6 hours' >> start.sh
RUN echo 'done' >> start.sh
RUN chmod +x start.sh

# Start
CMD ["./start.sh"]
```

---

## Step 4: Update Your Credentials

Edit the Dockerfile and replace:
```dockerfile
ENV NAUKRI_PASSWORD="YOUR_PASSWORD_HERE"
```

With your actual password.

---

## Step 5: Commit and Deploy

1. In your Space, click "Files" → "Add file" → "Create a new file"
2. Name it `Dockerfile`
3. Paste the content above
4. Click "Commit new file"

**Space will start building** (takes 5-10 minutes)

---

## Step 6: Monitor

1. Go to your Space
2. Click "Logs" tab
3. Watch the build process
4. Once running, you'll see script output

---

## Step 7: Check Results

```bash
# In the Logs tab, look for:
# - "Login successful"
# - "Headline updated"
# - Screenshots (if saved)

# Or check logs.txt in Files tab
```

---

## Cost

**Total**: $0 (completely free!)

---

## ⚠️ If Blocked by Naukri

Hugging Face uses datacenter IPs. If you see "Access Denied":

1. Try different Space region (if available)
2. Get residential proxy ($12-15/month)
3. Try PythonAnywhere instead

---

## Next Steps

1. ✅ Create Space (5 min)
2. ✅ Deploy Dockerfile (5 min)
3. ✅ Wait for build (10 min)
4. ✅ Check logs (5 min)

**Total**: 25 minutes  
**Cost**: $0

---

**Author**: Santosh Todkar  
**Date**: September 2026
