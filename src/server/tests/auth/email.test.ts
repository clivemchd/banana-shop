import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import { getVerificationEmailContent, getPasswordResetEmailContent } from '../../auth/email';

describe('Email Authentication Functions', () => {
  let originalConsoleLog: typeof console.log;

  beforeEach(() => {
    originalConsoleLog = console.log;
    console.log = vi.fn(); // Mock console.log to prevent test output noise
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('getVerificationEmailContent', () => {
    test('should return correct email content for verification', () => {
      const verificationLink = 'https://example.com/verify?token=abc123';
      
      const result = getVerificationEmailContent({ verificationLink });

      expect(result.subject).toBe('✨ Verify Your Nano Studio Email');
      expect(result.text).toContain('Welcome to Nano Studio!');
      expect(result.text).toContain(verificationLink);
      expect(result.text).toContain('This link will expire in 24 hours');
      expect(result.html).toContain('🍌 Nano Studio');
      expect(result.html).toContain(verificationLink);
    });

    test('should handle different verification link formats', () => {
      const verificationLink = 'http://localhost:3000/verify?token=def456';
      
      const result = getVerificationEmailContent({ verificationLink });

      expect(result.text).toContain(verificationLink);
      expect(result.html).toContain(verificationLink);
    });

    test('should include security warning', () => {
      const verificationLink = 'https://example.com/verify?token=abc123';
      
      const result = getVerificationEmailContent({ verificationLink });

      expect(result.text).toContain("If you didn't sign up for Nano Studio");
      expect(result.html).toContain("If you didn't create an account");
    });

    test('should include development mode notice', () => {
      const verificationLink = 'https://example.com/verify?token=abc123';
      
      const result = getVerificationEmailContent({ verificationLink });

      expect(result.text).toContain('🚧 DEVELOPMENT MODE');
      expect(result.html).toContain('Development Mode');
    });
  });

  describe('getPasswordResetEmailContent', () => {
    test('should return correct email content for password reset', () => {
      const passwordResetLink = 'https://example.com/reset?token=xyz789';
      
      const result = getPasswordResetEmailContent({ passwordResetLink });

      expect(result.subject).toBe('🔐 Reset Your Nano Studio Password');
      expect(result.text).toContain('Password Reset Request');
      expect(result.text).toContain(passwordResetLink);
      expect(result.text).toContain('This link will expire in 1 hour');
      expect(result.html).toContain('🔐 Password Reset');
      expect(result.html).toContain(passwordResetLink);
    });

    test('should handle different reset link formats', () => {
      const passwordResetLink = 'http://localhost:3000/reset?token=uvw123';
      
      const result = getPasswordResetEmailContent({ passwordResetLink });

      expect(result.text).toContain(passwordResetLink);
      expect(result.html).toContain(passwordResetLink);
    });

    test('should include security warnings', () => {
      const passwordResetLink = 'https://example.com/reset?token=xyz789';
      
      const result = getPasswordResetEmailContent({ passwordResetLink });

      expect(result.text).toContain("If you didn't request this reset");
      expect(result.html).toContain("If you didn't request this");
    });

    test('should include development mode notice', () => {
      const passwordResetLink = 'https://example.com/reset?token=xyz789';
      
      const result = getPasswordResetEmailContent({ passwordResetLink });

      expect(result.text).toContain('🚧 DEVELOPMENT MODE');
      expect(result.html).toContain('Development Mode');
    });

    test('should include security tips', () => {
      const passwordResetLink = 'https://example.com/reset?token=xyz789';
      
      const result = getPasswordResetEmailContent({ passwordResetLink });

      expect(result.text).toContain('Security Tips');
      expect(result.html).toContain('Security Tips');
      expect(result.text).toContain('Use a strong, unique password');
      expect(result.html).toContain('Use a strong, unique password');
    });
  });

  describe('Logging behavior', () => {
    test('should log email content calls', () => {
      const verificationLink = 'https://example.com/verify?token=test';
      const resetLink = 'https://example.com/reset?token=test';

      getVerificationEmailContent({ verificationLink });
      getPasswordResetEmailContent({ passwordResetLink: resetLink });

      expect(console.log).toHaveBeenCalledWith(
        '🔧 DEBUG: getVerificationEmailContent called with link:',
        verificationLink
      );
      expect(console.log).toHaveBeenCalledWith(
        '🔧 DEBUG: getPasswordResetEmailContent called with link:',
        resetLink
      );
    });
  });
});