# Email Troubleshooting Guide

## Quick Fix for "Failed to send verification email"

### Option 1: Development Mode (Skip Email)

Add to `backend/.env`:
```env
SKIP_EMAIL_VERIFICATION=true
```

This will:
- ✅ Allow registration without email
- ✅ Log OTP to console for testing
- ✅ Mark users as verified automatically
- ⚠️ Only for development/testing

### Option 2: Configure SMTP (Production)

1. **Sign up for free SMTP service** (Brevo recommended):
   - Go to https://www.brevo.com/
   - Create free account (300 emails/day)

2. **Get SMTP credentials**:
   - Go to Settings → SMTP & API → SMTP
   - Copy your SMTP login email
   - Copy your SMTP key (NOT your account password)

3. **Add to `backend/.env`**:
```env
SMTP_PROVIDER=brevo
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-brevo-smtp-key
SMTP_FROM_EMAIL=your-email@example.com
SMTP_FROM_NAME=Aagman Gate Pass System
```

4. **Test configuration**:
```bash
cd backend
node src/utils/test-email.js
```

## Common Errors

### Error: "SMTP credentials not configured"
**Solution**: 
- Add SMTP credentials to `.env` file
- OR set `SKIP_EMAIL_VERIFICATION=true` for development

### Error: "SMTP authentication failed"
**Solution**:
- Check SMTP_USER and SMTP_PASS are correct
- For Brevo: Use SMTP key, NOT account password
- Verify credentials in provider dashboard

### Error: "Could not connect to SMTP server"
**Solution**:
- Check internet connection
- Verify SMTP_HOST and SMTP_PORT are correct
- Check firewall settings
- Try different port (587 for TLS, 465 for SSL)

## Development Workflow

1. **For local development** (no email needed):
   ```env
   SKIP_EMAIL_VERIFICATION=true
   ```
   - OTP will be logged to console
   - Users auto-verified

2. **For testing email**:
   - Configure SMTP credentials
   - Remove `SKIP_EMAIL_VERIFICATION` or set to `false`
   - Test with `node src/utils/test-email.js`

3. **For production**:
   - Always configure SMTP
   - Never use `SKIP_EMAIL_VERIFICATION=true`
   - Test email sending before deployment

## Testing

### Test SMTP Connection
```bash
cd backend
node src/utils/test-email.js
```

### Test Registration Flow
1. Set `SKIP_EMAIL_VERIFICATION=true` in `.env`
2. Register a new user
3. Check console for OTP
4. Use OTP to verify account

## Environment Variables Reference

```env
# Email Configuration
SMTP_PROVIDER=brevo              # brevo, mailersend, smtp2go
SMTP_HOST=smtp-relay.brevo.com   # SMTP server host
SMTP_PORT=587                    # SMTP port (587 for TLS)
SMTP_USER=your-email@example.com # SMTP username
SMTP_PASS=your-smtp-key          # SMTP password/key
SMTP_FROM_EMAIL=noreply@domain.com # Sender email
SMTP_FROM_NAME=Aagman System     # Sender name

# Development Mode (optional)
SKIP_EMAIL_VERIFICATION=false    # Set to true to skip email in dev
NODE_ENV=development             # Set to production for production
```

