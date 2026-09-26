# Naukri Profile Automation

Automatically update your Naukri.com profile using GitHub Actions. This includes:
- Random resume headline updates from a predefined list
- CV selection from your CV bank
- Scheduled runs throughout the day (7 AM - 8 PM IST)

## ⚠️ Important Disclaimer

**Use at your own risk.** Automated bot access to job portals may violate Naukri's Terms of Service. This could result in:
- Account suspension or banning
- CAPTCHA challenges
- Security alerts

Consider using this for educational purposes or with explicit permission.

## Setup Instructions

### 1. Configure GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

| Secret Name | Value |
|-------------|-------|
| `NAUKRI_EMAIL` | Your Naukri login email (e.g., todkarsant@gmail.com) |
| `NAUKRI_PASSWORD` | Your Naukri account password |

### 2. Add Your Resumes

Place your resume files in the `cv-bank/resumes/` directory:
- PDF, DOCX, or TXT formats
- Multiple versions for variety

### 3. Customize Headlines

Edit `cv-bank/headlines.txt` with your preferred resume headlines (one per line).

### 4. Adjust Schedule (Optional)

Edit `.github/workflows/naukri-update.yml` to change the cron schedule:

```yaml
# Current schedule (IST times):
- cron: '30 1 * * *'   # ~7:00 AM IST
- cron: '45 3 * * *'   # ~9:15 AM IST
- cron: '15 5 * * *'   # ~10:45 AM IST
- cron: '0 7 * * *'    # ~12:30 PM IST
- cron: '30 9 * * *'   # ~2:00 PM IST
- cron: '45 11 * * *'  # ~4:15 PM IST
- cron: '15 13 * * *'  # ~6:45 PM IST
```

### 5. Enable GitHub Actions

1. Go to the Actions tab in your repository
2. Click "I understand my workflows, go ahead and enable them"
3. The workflow will run automatically on schedule

### 6. Manual Testing

To test manually:
1. Go to Actions → "Naukri Profile Auto-Update"
2. Click "Run workflow"
3. Check the logs for any errors

## Troubleshooting

### Login Issues
- Verify your credentials in GitHub Secrets
- Check if Naukri requires 2FA (not supported yet)
- Look at the screenshot artifacts in failed runs

### CAPTCHA Challenges
- Naukri may show CAPTCHA for automated access
- Consider reducing update frequency
- Manual intervention may be required

### Profile Elements Not Found
- Naukri's UI may change
- Check screenshot artifacts to see the actual page
- Update selectors in `scripts/update-naukri.js`

## Logs & Monitoring

- Check the Actions tab for run history
- Download log artifacts for detailed debugging
- Screenshots are saved for each run

## Customization

### Change Update Frequency

Edit the cron expressions in `.github/workflows/naukri-update.yml`:
- More frequent: Add more cron entries
- Less frequent: Remove some entries
- Different times: Adjust the cron values

### Add More Features

Edit `scripts/update-naukri.js` to:
- Update additional profile sections
- Add skills/endorsements
- Update job preferences

## Security Best Practices

- ✅ Never commit passwords to the repository
- ✅ Use GitHub Secrets for all credentials
- ✅ Review and audit workflow runs regularly
- ✅ Keep dependencies updated

## License

MIT License - Use at your own risk

## Author

Santosh Todkar - Software Builder, Bengaluru
