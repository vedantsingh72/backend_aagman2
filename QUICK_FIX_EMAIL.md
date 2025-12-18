# Quick Fix: Email Verification Error

## 🚨 Error: "Failed to send verification email. Please try again."

### ✅ IMMEDIATE FIX (Development)

Add this to your `backend/.env` file:

```env
SKIP_EMAIL_VERIFICATION=true
```

**What this does:**
- ✅ Allows registration without email
- ✅ Logs OTP to console (check backend terminal)
- ✅ Auto-verifies users
- ✅ No SMTP setup needed

**After adding this:**
1. Restart backend server
2. Try registration again
3. Check backend console for OTP code
4. Use that OTP to verify account

### 📧 For Production (Configure SMTP)

1. **Sign up for Brevo** (free, 300 emails/day):
   - https://www.brevo.com/
   - Create account

2. **Get SMTP credentials**:
   - Go to: Settings → SMTP & API → SMTP
   - Copy SMTP login email
   - Copy SMTP key (NOT password)

3. **Add to `backend/.env`**:
```env
SMTP_PROVIDER=brevo
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-brevo-smtp-key-here
SMTP_FROM_EMAIL=your-email@example.com
SMTP_FROM_NAME=Aagman Gate Pass System
SKIP_EMAIL_VERIFICATION=false

# If you get "self-signed certificate" error, add this (development only):
SMTP_REJECT_UNAUTHORIZED=false
```

4. **Restart backend**

5. **Test**:
```bash
cd backend
node src/utils/test-email.js
```

## 🔍 Check Backend Console

When registration fails, check backend terminal for:
- Error details
- SMTP configuration status
- OTP code (if SKIP_EMAIL_VERIFICATION=true)

## 📝 Current Status

The system now:
- ✅ Works without email in development
- ✅ Shows helpful error messages
- ✅ Logs OTP to console for testing
- ✅ Handles SMTP errors gracefully

