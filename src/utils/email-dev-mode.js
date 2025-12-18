/**
 * Development Mode Email Helper
 * Allows testing registration without SMTP configuration
 * 
 * Usage: Set SKIP_EMAIL_VERIFICATION=true in .env
 */

/**
 * Log OTP to console instead of sending email
 * Useful for development when SMTP is not configured
 */
export const logOTPToConsole = (email, otp, name) => {
  console.log('\n' + '='.repeat(60));
  console.log('📧 DEVELOPMENT MODE - OTP Email (Not Sent)');
  console.log('='.repeat(60));
  console.log(`To: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`OTP: ${otp}`);
  console.log(`Expires: 10 minutes from now`);
  console.log('='.repeat(60));
  console.log('⚠️  In production, this would be sent via email');
  console.log('⚠️  Set up SMTP credentials in .env to enable email sending\n');
};

