# Email Service - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Choose a Free Provider

**Recommended: Brevo** (300 emails/day free)
1. Sign up at https://www.brevo.com/
2. Go to Settings → SMTP & API → SMTP
3. Copy your SMTP login and SMTP key

### Step 2: Configure Environment Variables

Create/update `backend/.env`:

```env
# Email Provider
SMTP_PROVIDER=brevo

# SMTP Settings (from Brevo dashboard)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-brevo-smtp-key

# Sender Details
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Aagman Gate Pass System
```

### Step 3: Test Configuration

```bash
cd backend
node src/utils/test-email.js
```

## 📧 How It Works

### Registration Flow

1. **User Registers** → `POST /api/users/register`
   - System generates 6-digit OTP
   - OTP is hashed and stored in database
   - Email sent with OTP code

2. **User Verifies** → `POST /api/auth/verify-otp`
   - User enters OTP from email
   - System verifies OTP
   - Account marked as verified

3. **User Logs In** → `POST /api/auth/login`
   - System checks `isVerified === true`
   - Only verified users can login

### Code Integration

**Registration Controller** (`backend/src/controllers/user.controller.js`):
```javascript
import { sendOTPEmail } from "../utils/email.utils.js";

// After creating user
await sendOTPEmail(email, otp, name);
```

**Resend OTP** (`backend/src/controllers/auth.controller.js`):
```javascript
// Generate new OTP and send
await sendOTPEmail(email, otp, user.name);
```

## 🔧 Supported Providers

| Provider | Free Tier | Setup Time | Best For |
|----------|-----------|------------|----------|
| **Brevo** | 300/day | 2 min | ⭐ Recommended |
| MailerSend | 12K/month | 3 min | High volume |
| SMTP2GO | 1K/month | 2 min | Small apps |

## 📝 Example Usage

### Sending OTP Email

```javascript
import { sendOTPEmail } from './utils/email.utils.js';

try {
  await sendOTPEmail('student@example.com', '123456', 'John Doe');
  console.log('Email sent!');
} catch (error) {
  console.error('Failed:', error.message);
}
```

### Sending Custom Email

```javascript
import { sendEmail } from './utils/email.utils.js';

await sendEmail({
  to: 'user@example.com',
  subject: 'Pass Approved',
  html: '<h1>Your pass has been approved!</h1>',
  text: 'Your pass has been approved!'
});
```

## ⚙️ Environment Variables

Required variables in `.env`:

```env
SMTP_PROVIDER=brevo              # Provider name
SMTP_HOST=smtp-relay.brevo.com  # SMTP server
SMTP_PORT=587                    # SMTP port
SMTP_USER=your-email@example.com # SMTP username
SMTP_PASS=your-smtp-key          # SMTP password/key
SMTP_FROM_EMAIL=noreply@domain.com # Sender email
SMTP_FROM_NAME=Aagman System     # Sender name
```

## 🐛 Troubleshooting

### "SMTP authentication failed"
- ✅ Check SMTP_USER and SMTP_PASS are correct
- ✅ For Brevo: Use SMTP key, NOT account password
- ✅ Verify credentials in provider dashboard

### "Connection timeout"
- ✅ Check SMTP_HOST and SMTP_PORT
- ✅ Verify firewall allows outbound SMTP
- ✅ Try port 465 with SMTP_SECURE=true

### "Emails not received"
- ✅ Check spam/junk folder
- ✅ Verify sender email in provider dashboard
- ✅ Check daily/monthly sending limits

## 📚 Full Documentation

See `EMAIL_SETUP.md` for detailed setup instructions and troubleshooting.

## 🔒 Security Notes

- ✅ Never commit `.env` file
- ✅ Use strong SMTP keys
- ✅ Rotate credentials periodically
- ✅ Monitor email sending activity

