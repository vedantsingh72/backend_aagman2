# Email Service Setup Guide

This guide explains how to configure the free-tier email service for the Aagman Gate Pass System.

## Supported Free SMTP Providers

### 1. Brevo (Recommended) ⭐
- **Free Tier**: 300 emails/day
- **Sign Up**: https://www.brevo.com/
- **Setup**:
  1. Create a free account at Brevo
  2. Go to Settings → SMTP & API → SMTP
  3. Copy your SMTP login email and SMTP key
  4. Use these in your `.env` file

### 2. MailerSend
- **Free Tier**: 12,000 emails/month
- **Sign Up**: https://www.mailersend.com/
- **Setup**:
  1. Create a free account
  2. Go to Settings → SMTP
  3. Copy your SMTP credentials

### 3. SMTP2GO
- **Free Tier**: 1,000 emails/month
- **Sign Up**: https://www.smtp2go.com/
- **Setup**:
  1. Create a free account
  2. Go to Settings → SMTP Users
  3. Create an SMTP user and copy credentials

## Configuration

### Step 1: Choose Your Provider

Edit `backend/.env` and set:

```env
SMTP_PROVIDER=brevo  # or mailersend, smtp2go
```

### Step 2: Add SMTP Credentials

```env
# Brevo Example
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-brevo-smtp-key

# MailerSend Example
SMTP_HOST=smtp.mailersend.com
SMTP_PORT=587
SMTP_USER=your-mailersend-username
SMTP_PASS=your-mailersend-password

# SMTP2GO Example
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=your-smtp2go-username
SMTP_PASS=your-smtp2go-password

# SSL Certificate Handling (Development Only)
# If you get "self-signed certificate" error, add:
SMTP_REJECT_UNAUTHORIZED=false
# ⚠️ WARNING: Only use this in development, never in production!
```

### Step 3: Configure Sender Details

```env
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Aagman Gate Pass System
```

## Testing Email Configuration

You can test your SMTP connection by creating a simple test script:

```javascript
import { verifySMTPConnection } from './src/utils/email.utils.js';

const result = await verifySMTPConnection();
console.log(result);
```

## Usage in Code

### Sending OTP Email

```javascript
import { sendOTPEmail } from './src/utils/email.utils.js';

try {
  await sendOTPEmail('student@example.com', '123456', 'John Doe');
  console.log('OTP email sent successfully');
} catch (error) {
  console.error('Failed to send email:', error.message);
}
```

### Sending Custom Email

```javascript
import { sendEmail } from './src/utils/email.utils.js';

await sendEmail({
  to: 'user@example.com',
  subject: 'Pass Approved',
  html: '<h1>Your pass has been approved!</h1>',
  text: 'Your pass has been approved!'
});
```

## Integration Points

### 1. User Registration
- **File**: `backend/src/controllers/user.controller.js`
- **Function**: `registerUser`
- **Flow**: User registers → OTP generated → Email sent → User verifies

### 2. OTP Resend
- **File**: `backend/src/controllers/auth.controller.js`
- **Function**: `resendOTP`
- **Flow**: User requests new OTP → Email sent with new code

## Free Tier Limits

| Provider | Free Tier Limit | Best For |
|----------|----------------|----------|
| Brevo | 300 emails/day | Small to medium apps |
| MailerSend | 12,000/month | Medium apps |
| SMTP2GO | 1,000/month | Small apps |

**Note**: Monitor your email usage to avoid hitting limits. Consider implementing:
- Email queue for high-volume scenarios
- Rate limiting for OTP requests
- Fallback email provider

## Troubleshooting

### Common Issues

1. **Authentication Failed (EAUTH)**
   - Check SMTP_USER and SMTP_PASS are correct
   - For Brevo: Use SMTP key, not account password
   - Ensure credentials are from SMTP settings, not API settings

2. **Connection Timeout (ETIMEDOUT)**
   - Check firewall settings
   - Verify SMTP_HOST and SMTP_PORT are correct
   - Try different port (587 for TLS, 465 for SSL)

3. **Emails Not Received**
   - Check spam folder
   - Verify sender email is verified in provider dashboard
   - Check provider's sending limits

## Production Considerations

1. **Environment Variables**: Never commit `.env` file
2. **Error Handling**: Always handle email failures gracefully
3. **Rate Limiting**: Implement rate limits for OTP requests
4. **Monitoring**: Track email delivery rates
5. **Backup Provider**: Consider having a backup SMTP provider

## Security Best Practices

- Store SMTP credentials in environment variables only
- Use strong, unique SMTP keys
- Rotate credentials periodically
- Monitor for unauthorized access
- Use TLS/SSL for all SMTP connections

