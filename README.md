# Naukri Profile Automation (API-Based)

Automatically update your Naukri.com profile using the **NopeRi API client**. This bypasses browser automation and uses Naukri's internal API directly.

## Features

- ✅ **No browser automation** - Uses API calls (bypasses WAF blocking)
- ✅ **Random headline updates** - From your predefined list of 20 headlines
- ✅ **Resume upload** - Uploads random CV from your CV bank
- ✅ **Scheduled runs** - 7 times daily at varied times (7 AM - 8 PM IST)
- ✅ **GitHub Secrets** - Secure credential storage

## ⚠️ Important Disclaimer

**Use at your own risk.** Automated API access to Naukri may violate their Terms of Service. This could result in:
- Account suspension or restrictions
- API access blocking

This is for educational purposes. Use responsibly.

## Setup Instructions

### 1. Add Your Resume Files

Upload your resume/CV files to the `cv-bank/resumes/` directory:
- PDF format recommended (.pdf)
- Multiple versions for variety
- Example: `resume-backend.pdf`, `resume-fullstack.pdf`, etc.

### 2. Configure GitHub Secrets

Go to your repository **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name | Value |
|-------------|-------|
| `NAUKRI_EMAIL` | Your Naukri login email (todkarsant@gmail.com) |
| `NAUKRI_PASSWORD` | Your Naukri account password |

### 3. Customize Headlines (Optional)

Edit `cv-bank/headlines.txt` with your preferred resume headlines (one per line).

### 4. Enable GitHub Actions

1. Go to the **Actions** tab
2. Click **"I understand my workflows, go ahead and enable them"**
3. The workflow will run automatically on schedule

### 5. Manual Testing

To test manually:
1. Go to **Actions** → **"Naukri Profile Auto-Update"**
2. Click **"Run workflow"**
3. Check the logs for results

## How It Works

The script uses the **NopeRi** library - a Python API client that:
1. Authenticates with Naukri using your credentials
2. Gets an API token
3. Updates your profile headline via API call
4. Uploads your resume via API call

This bypasses the WAF (Web Application Firewall) that blocks browser automation from GitHub Actions.

## File Structure

```
naukri-automation/
├── .github/workflows/
│   └── naukri-update.yml      # GitHub Actions workflow
├── cv-bank/
│   ├── headlines.txt          # 20 resume headline variations
│   └── resumes/               # Your resume files (PDF/DOCX)
├── naukri_updater.py          # Main Python script
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Schedule (IST Times)

The workflow runs at these times (randomized throughout the day):
- ~7:00 AM IST
- ~9:15 AM IST
- ~10:45 AM IST
- ~12:30 PM IST
- ~2:00 PM IST
- ~4:15 PM IST
- ~6:45 PM IST

## Troubleshooting

### API Authentication Failed
- Verify your credentials in GitHub Secrets
- Check if your Naukri account is active
- Ensure no 2FA is enabled (not supported yet)

### Resume Upload Failed
- Make sure resume files are in `cv-bank/resumes/`
- Files should be PDF format (recommended)
- File size should be under 2MB

### Headline Not Updating
- Check `cv-bank/headlines.txt` exists
- Verify file has at least one headline
- Check logs for API error messages

## Customization

### Change Update Frequency

Edit `.github/workflows/naukri-update.yml` and modify the cron expressions:
- More frequent: Add more cron entries
- Less frequent: Remove some entries
- Different times: Adjust the cron values

### Add More Features

Edit `naukri_updater.py` to:
- Update additional profile fields (summary, skills, etc.)
- Add job search functionality
- Implement auto-apply features

## Dependencies

- **Python 3.11+**
- **NopeRi** - Naukri API client (auto-installed)
- **requests** - HTTP library

## Security Best Practices

- ✅ Never commit passwords to the repository
- ✅ Use GitHub Secrets for all credentials
- ✅ Keep resume files minimal (no sensitive info)
- ✅ Review workflow runs regularly

## Credits

- **NopeRi Library**: [Traverser25/NopeRi](https://github.com/Traverser25/NopeRi)
- **Author**: Santosh Todkar - Software Builder, Bengaluru

## License

MIT License - Use at your own risk
