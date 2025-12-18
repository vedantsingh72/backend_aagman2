/**
 * Email Service Test Utility
 * Use this to test your SMTP configuration
 * 
 * Run: node src/utils/test-email.js
 */

import dotenv from 'dotenv';
import { verifySMTPConnection, sendOTPEmail } from './email.utils.js';

// Load environment variables
dotenv.config();

/**
 * Test SMTP Connection
 */
async function testConnection() {
  console.log('🔍 Testing SMTP connection...\n');
  
  const result = await verifySMTPConnection();
  
  if (result.success) {
    console.log('✅', result.message);
    console.log('\n📧 SMTP Configuration:');
    console.log('   Provider:', process.env.SMTP_PROVIDER || 'brevo');
    console.log('   Host:', process.env.SMTP_HOST || 'smtp-relay.brevo.com');
    console.log('   Port:', process.env.SMTP_PORT || '587');
    console.log('   User:', process.env.SMTP_USER);
  } else {
    console.log('❌', result.message);
    console.log('   Error:', result.error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check SMTP_USER and SMTP_PASS in .env');
    console.log('   2. Verify SMTP_HOST and SMTP_PORT are correct');
    console.log('   3. For Brevo: Use SMTP key, not account password');
    console.log('   4. Check firewall/network settings');
    
    // Specific help for certificate errors
    if (result.error && result.error.includes('certificate')) {
      console.log('\n🔒 Certificate Error Detected:');
      console.log('   Add to .env: SMTP_REJECT_UNAUTHORIZED=false');
      console.log('   ⚠️  Only use this in development, not production!');
    }
  }
}

/**
 * Test Sending OTP Email
 */
async function testSendEmail() {
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  if (testEmail === 'test@example.com') {
    console.log('\n⚠️  Set TEST_EMAIL in .env to test email sending');
    console.log('   Example: TEST_EMAIL=your-email@example.com\n');
    return;
  }

  console.log(`\n📨 Testing email sending to ${testEmail}...\n`);
  
  try {
    const result = await sendOTPEmail(testEmail, '123456', 'Test User');
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.messageId);
    console.log('   Accepted:', result.accepted);
    console.log('\n📬 Check your inbox (and spam folder) for the test email.');
  } catch (error) {
    console.log('❌ Failed to send email');
    console.log('   Error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('  Email Service Test');
  console.log('='.repeat(50));
  
  await testConnection();
  await testSendEmail();
  
  console.log('\n' + '='.repeat(50));
}

// Execute if run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('test-email.js');

if (isMainModule) {
  runTests().catch(console.error);
}

export { testConnection, testSendEmail };

