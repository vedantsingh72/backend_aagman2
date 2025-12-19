# Fix: "Self-Signed Certificate in Certificate Chain" Error

## 🔒 Error Message
```
SMTP connection failed
   Error: self-signed certificate in certificate chain
```

## ✅ Quick Fix

Add this to your `backend/.env` file:

```env
SMTP_REJECT_UNAUTHORIZED=false
```

**What this does:**
- ✅ Disables SSL certificate validation
- ✅ Allows connection to SMTP servers with self-signed certificates
- ⚠️ **Only use in development, not production!**

## 🔍 Why This Happens

Some SMTP providers or network configurations use:
- Self-signed certificates
- Certificates from untrusted CAs
- Corporate proxies with custom certificates

Node.js by default rejects these for security, causing the error.

## 📝 Complete .env Configuration

For development with certificate issues:

```env
# SMTP Configuration
SMTP_PROVIDER=brevo
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-brevo-smtp-key
SMTP_FROM_EMAIL=your-email@example.com
SMTP_FROM_NAME=Aagman Gate Pass System

# SSL Certificate (Development Only)
SMTP_REJECT_UNAUTHORIZED=false

# Development Mode (Skip Email)
SKIP_EMAIL_VERIFICATION=false
```

## 🧪 Test After Fix

```bash
cd backend
node src/utils/test-email.js
```

You should now see:
```
✅ SMTP connection verified successfully
```

## ⚠️ Security Warning

**DO NOT** use `SMTP_REJECT_UNAUTHORIZED=false` in production!

In production:
1. Use proper SMTP providers with valid certificates
2. Keep `SMTP_REJECT_UNAUTHORIZED` unset or remove it
3. Ensure certificates are valid and trusted

## 🔄 Alternative Solutions

### Option 1: Use Different Port
Some providers support port 465 (SSL) instead of 587 (TLS):
```env
SMTP_PORT=465
SMTP_SECURE=true
```

### Option 2: Use Different Provider
Try a different SMTP provider:
- MailerSend: `smtp.mailersend.com`
- SMTP2GO: `mail.smtp2go.com`

### Option 3: Development Mode (No Email)
Skip email entirely for development:
```env
SKIP_EMAIL_VERIFICATION=true
```

## 📚 Related Files

- `backend/src/utils/email.utils.js` - Email configuration
- `backend/src/utils/test-email.js` - Test utility
- `backend/EMAIL_SETUP.md` - Full setup guide




