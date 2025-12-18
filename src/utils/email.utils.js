import nodemailer from 'nodemailer';

/**
 * Email Service Configuration
 * Supports free-tier SMTP providers:
 * - Brevo (formerly Sendinblue): 300 emails/day free
 * - MailerSend: 12,000 emails/month free
 * - SMTP2GO: 1,000 emails/month free
 * - Gmail: Limited (requires app password)
 */

/**
 * Get SMTP configuration based on provider
 * Defaults to Brevo (recommended free tier)
 */
const getSMTPConfig = () => {
  const provider = (process.env.SMTP_PROVIDER || 'brevo').toLowerCase();
  
  // Brevo (formerly Sendinblue) - Recommended
  // Free tier: 300 emails/day
  // Sign up: https://www.brevo.com/
  if (provider === 'brevo' || provider === 'sendinblue') {
    return {
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER, // Your Brevo SMTP login email
        pass: process.env.SMTP_PASS, // Your Brevo SMTP key (not password)
      },
    };
  }

  // MailerSend
  // Free tier: 12,000 emails/month
  // Sign up: https://www.mailersend.com/
  if (provider === 'mailersend') {
    return {
      host: process.env.SMTP_HOST || 'smtp.mailersend.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER, // Your MailerSend SMTP username
        pass: process.env.SMTP_PASS, // Your MailerSend SMTP password
      },
    };
  }

  // SMTP2GO
  // Free tier: 1,000 emails/month
  // Sign up: https://www.smtp2go.com/
  if (provider === 'smtp2go') {
    return {
      host: process.env.SMTP_HOST || 'mail.smtp2go.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER, // Your SMTP2GO username
        pass: process.env.SMTP_PASS, // Your SMTP2GO password
      },
    };
  }

  // Custom SMTP (fallback)
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
};

/**
 * Create email transporter
 * Uses free-tier SMTP provider configuration
 */
const createTransporter = () => {
  const config = getSMTPConfig();

  // Validate required environment variables
  if (!config.auth.user || !config.auth.pass) {
    const error = new Error(
      'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file.'
    );
    error.code = 'ENOCONFIG';
    throw error;
  }

  // TLS options - handle certificate validation
  // Default behavior:
  // - Development: Allow self-signed certificates (rejectUnauthorized = false)
  // - Production: Reject self-signed certificates (rejectUnauthorized = true)
  // - Can be overridden with SMTP_REJECT_UNAUTHORIZED env var
  let rejectUnauthorized;
  
  if (process.env.SMTP_REJECT_UNAUTHORIZED !== undefined) {
    // Explicitly set by user
    rejectUnauthorized = process.env.SMTP_REJECT_UNAUTHORIZED === 'true';
  } else {
    // Default: strict in production, lenient in development
    rejectUnauthorized = process.env.NODE_ENV === 'production';
  }
  
  const tlsOptions = {
    rejectUnauthorized: rejectUnauthorized,
  };

  // Log certificate validation status
  if (!rejectUnauthorized) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  WARNING: SSL certificate validation is disabled in production. This is not recommended for security.');
    } else {
      console.log('ℹ️  Development mode: SSL certificate validation disabled (allows self-signed certificates)');
    }
  }

  return nodemailer.createTransport({
    ...config,
    // TLS options for certificate handling
    tls: tlsOptions,
    // Connection pool for better performance
    pool: true,
    // Retry configuration for free-tier reliability
    maxConnections: 1,
    maxMessages: 100,
    // Timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 10000, // 10 seconds
  });
};

/**
 * Verify SMTP connection
 * Useful for testing configuration
 */
export const verifySMTPConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (error) {
    return {
      success: false,
      message: 'SMTP connection failed',
      error: error.message,
    };
  }
};

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} name - Recipient name
 * @returns {Promise<Object>} Email send result
 */
export const sendOTPEmail = async (email, otp, name) => {
  let transporter;
  
  try {
    transporter = createTransporter();

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'Aagman Gate Pass System';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Verify Your Email - Aagman Gate Pass System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Aagman Gate Pass</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-top: 0;">Email Verification</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hello ${name || 'there'},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for registering with Aagman Gate Pass System. Please verify your email address by entering the code below:
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px;">
              <h1 style="color: #ffffff; font-size: 42px; letter-spacing: 8px; margin: 0; font-weight: bold;">
                ${otp}
              </h1>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you didn't register for this account, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </body>
        </html>
      `,
      // Plain text fallback
      text: `
        Aagman Gate Pass System - Email Verification
        
        Hello ${name || 'there'},
        
        Thank you for registering. Your verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't register for this account, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log success (without sensitive data)
    console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (error) {
    // Enhanced error logging
    console.error('Email sending failed:', {
      to: email,
      error: error.message,
      code: error.code,
      command: error.command,
    });

    // Provide user-friendly error messages
    let errorMessage = 'Failed to send verification email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check your credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server. Please check your network.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'SMTP connection timed out. Please try again.';
    }

    throw new Error(errorMessage);
  } finally {
    // Close transporter connection
    if (transporter) {
      transporter.close();
    }
  }
};

/**
 * Send generic transactional email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<Object>} Email send result
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;
  
  try {
    transporter = createTransporter();

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'Aagman Gate Pass System';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (error) {
    console.error('Email sending failed:', {
      to,
      error: error.message,
      code: error.code,
    });

    throw new Error(`Failed to send email: ${error.message}`);
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
};

