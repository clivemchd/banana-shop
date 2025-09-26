import { type GetVerificationEmailContentFn, type GetPasswordResetEmailContentFn } from 'wasp/server/auth';

console.log('📧 EMAIL MODULE LOADED - This should appear when server starts');

export const getVerificationEmailContent: GetVerificationEmailContentFn = ({ verificationLink }) => {
  console.log('🔧 DEBUG: getVerificationEmailContent called with link:', verificationLink);
  
  const emailContent = {
    subject: '✨ Verify Your Nano Studio Email',
  text: `Welcome to Nano Studio!

Thanks for signing up! We need to verify your email address to complete your account setup.

Click the link below to verify your email:
${verificationLink}

This link will expire in 24 hours for security reasons.

If you didn't sign up for Nano Studio, you can safely ignore this email.

Welcome aboard!
The Nano Studio Team

---
🚧 DEVELOPMENT MODE: This email is being logged to the terminal instead of being sent.
📧 In production, this would be sent to the user's email address.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">🍌 Nano Studio</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome to Nano Studio! ✨</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Thanks for signing up! We need to verify your email address to complete your account setup.
        </p>
        <p style="color: #4b5563; line-height: 1.6;">
          Click the button below to verify your email:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #10b981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;
                    display: inline-block;">
            Verify My Email
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          <strong>Security Note:</strong> This link will expire in 24 hours for security reasons.
        </p>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; 
                  padding: 15px; margin-top: 20px;">
        <p style="color: #92400e; font-size: 13px; margin: 0; text-align: center;">
          <strong>🚧 Development Mode:</strong> This email is being logged to the terminal instead of being sent.
        </p>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Verification Link:<br>
          <a href="${verificationLink}" style="color: #3b82f6; word-break: break-all;">
            ${verificationLink}
          </a>
        </p>
      </div>
    </div>
  `,
  };

  // Log the email content to terminal since Dummy provider might not do it
  console.log('\n' + '='.repeat(80));
  console.log('📧 VERIFICATION EMAIL SENT (Development Mode - Dummy Provider)');
  console.log('='.repeat(80));
  console.log('Subject:', emailContent.subject);
  console.log('To: [User email address]');
  console.log('Content:');
  console.log(emailContent.text);
  console.log('='.repeat(80));
  console.log('\n');

  return emailContent;
};

export const getPasswordResetEmailContent: GetPasswordResetEmailContentFn = ({ passwordResetLink }) => {
  console.log('🔧 DEBUG: getPasswordResetEmailContent called with link:', passwordResetLink);

  const emailContent = {
    subject: '🔐 Reset Your Nano Studio Password',
    text: `Hi there!

You requested a password reset for your Nano Studio account.

Click the link below to reset your password:
${passwordResetLink}

This link will expire in 24 hours for security reasons.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Nano Studio Team

---
🚧 DEVELOPMENT MODE: This email is being logged to the terminal instead of being sent.
📧 In production, this would be sent to the user's email address.`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">🍌 Nano Studio</h1>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Hi there! You requested a password reset for your Nano Studio account.
        </p>
        <p style="color: #4b5563; line-height: 1.6;">
          Click the button below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${passwordResetLink}" 
             style="background-color: #f59e0b; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;
                    display: inline-block;">
            Reset My Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          <strong>Security Note:</strong> This link will expire in 24 hours for security reasons.
        </p>
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; 
                  padding: 15px; margin-top: 20px;">
        <p style="color: #92400e; font-size: 13px; margin: 0; text-align: center;">
          <strong>🚧 Development Mode:</strong> This email is being logged to the terminal instead of being sent.
        </p>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Password Reset Link:<br>
          <a href="${passwordResetLink}" style="color: #3b82f6; word-break: break-all;">
            ${passwordResetLink}
          </a>
        </p>
      </div>
    </div>
  `,
  };

  // Log the email content to terminal since Dummy provider might not do it
  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL SENT (Development Mode - Dummy Provider)');
  console.log('='.repeat(80));
  console.log('Subject:', emailContent.subject);
  console.log('To: [Requested email address]');
  console.log('Content:');
  console.log(emailContent.text);
  console.log('='.repeat(80));
  console.log('\n');

  return emailContent;
};
