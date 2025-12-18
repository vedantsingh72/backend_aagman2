# Email Service Integration Points

This document explains where and how the email service integrates into the Aagman Gate Pass System.

## 📍 Integration Points

### 1. User Registration Flow

**File**: `backend/src/controllers/user.controller.js`  
**Function**: `registerUser`  
**Endpoint**: `POST /api/users/register`

**Flow**:
```
User submits registration form
  ↓
System validates data
  ↓
System generates 6-digit OTP
  ↓
System hashes OTP and stores in database
  ↓
System creates user (isVerified = false)
  ↓
System sends OTP email via sendOTPEmail()
  ↓
If email fails → Delete user and return error
If email succeeds → Return success message
  ↓
User receives email with OTP
  ↓
User navigates to /verify-otp page
  ↓
User enters OTP
  ↓
System verifies OTP
  ↓
User account marked as verified (isVerified = true)
```

**Code Location**:
```javascript
// Line 45-52 in user.controller.js
try {
  await sendOTPEmail(email, otp, name);
} catch (error) {
  // If email fails, delete the user and return error
  await User.findByIdAndDelete(user._id);
  throw new apiError(500, "Failed to send verification email. Please try again.");
}
```

### 2. OTP Resend Flow

**File**: `backend/src/controllers/auth.controller.js`  
**Function**: `resendOTP`  
**Endpoint**: `POST /api/auth/resend-otp`

**Flow**:
```
User clicks "Resend OTP" on frontend
  ↓
Frontend calls POST /api/auth/resend-otp
  ↓
System finds user by email
  ↓
System generates new OTP
  ↓
System updates user with new OTP and expiry
  ↓
System sends new OTP email via sendOTPEmail()
  ↓
User receives new OTP email
```

**Code Location**:
```javascript
// Line 103-113 in auth.controller.js
const otp = generateOTP();
const hashedOTP = await hashOTP(otp);
const otpExpiry = getOTPExpiry();

user.otp = hashedOTP;
user.otpExpiry = otpExpiry;
await user.save();

// Send OTP email
await sendOTPEmail(email, otp, user.name);
```

### 3. Login Verification Check

**File**: `backend/src/controllers/authentication.controller.js`  
**Function**: `login`  
**Endpoint**: `POST /api/auth/login`

**Flow**:
```
User attempts to login
  ↓
System finds user account
  ↓
System checks if user is verified (for students only)
  ↓
If not verified → Return error: "Please verify your email"
  ↓
If verified → Continue with password check
  ↓
If password correct → Generate JWT and return token
```

**Code Location**:
```javascript
// Line 33-36 in authentication.controller.js
// For students, check if email is verified
if (role === "user" && account.isVerified === false) {
  throw new apiError(403, "Please verify your email before logging in. Check your email for OTP.");
}
```

## 🔧 Email Service Functions

### `sendOTPEmail(email, otp, name)`

**Purpose**: Send OTP verification email to newly registered users

**Parameters**:
- `email` (string): Recipient email address
- `otp` (string): 6-digit OTP code
- `name` (string): Recipient's name

**Returns**: Promise resolving to email send result

**Usage Example**:
```javascript
import { sendOTPEmail } from '../utils/email.utils.js';

await sendOTPEmail('student@example.com', '123456', 'John Doe');
```

### `sendEmail({ to, subject, html, text })`

**Purpose**: Send custom transactional emails

**Parameters**:
- `to` (string): Recipient email
- `subject` (string): Email subject
- `html` (string): HTML email content
- `text` (string, optional): Plain text fallback

**Usage Example**:
```javascript
import { sendEmail } from '../utils/email.utils.js';

await sendEmail({
  to: 'student@example.com',
  subject: 'Gate Pass Approved',
  html: '<h1>Your pass has been approved!</h1>',
  text: 'Your pass has been approved!'
});
```

### `verifySMTPConnection()`

**Purpose**: Test SMTP configuration

**Returns**: Promise resolving to connection test result

**Usage Example**:
```javascript
import { verifySMTPConnection } from '../utils/email.utils.js';

const result = await verifySMTPConnection();
if (result.success) {
  console.log('SMTP configured correctly!');
}
```

## 📧 Email Templates

### OTP Verification Email

The OTP email includes:
- Professional HTML design
- Large, readable OTP code
- Expiry information (10 minutes)
- Plain text fallback
- Branding (Aagman Gate Pass System)

**Template Location**: `backend/src/utils/email.utils.js` (lines 100-150)

## 🔐 Security Features

1. **OTP Hashing**: OTPs are hashed using bcrypt before storage
2. **Expiry**: OTPs expire after 10 minutes
3. **One-time Use**: OTPs are cleared after successful verification
4. **Email Validation**: Email format validated before sending
5. **Error Handling**: Graceful error handling prevents information leakage

## 🚀 Future Enhancements

Potential email integrations:

1. **Pass Approval Notifications**
   - Email student when pass is approved
   - Email student when pass is rejected

2. **Reminder Emails**
   - Remind students of pending pass approvals
   - Remind students of upcoming pass expiry

3. **Admin Notifications**
   - Notify department when new pass is submitted
   - Notify academic office when department approves

## 📝 Configuration Checklist

Before deploying:

- [ ] SMTP provider account created
- [ ] SMTP credentials added to `.env`
- [ ] SMTP connection tested (`node src/utils/test-email.js`)
- [ ] Sender email verified in provider dashboard
- [ ] Email templates reviewed
- [ ] Error handling tested
- [ ] Rate limiting considered (for free tiers)

## 🔍 Monitoring

Monitor these metrics:
- Email delivery rate
- Email failure rate
- OTP verification rate
- Daily/monthly email usage (free tier limits)

