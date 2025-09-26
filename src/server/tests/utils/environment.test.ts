import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import { Environment, getServerConfig } from '../../utils/environment';

describe('Environment Utility', () => {
  let originalProcessEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original process.env
    originalProcessEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalProcessEnv;
  });

  describe('Environment detection', () => {
    test('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(Environment.isDevelopment).toBe(true);
      expect(Environment.isProduction).toBe(false);
      expect(Environment.nodeEnv).toBe('development');
    });

    test('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      expect(Environment.isDevelopment).toBe(false);
      expect(Environment.isProduction).toBe(true);
      expect(Environment.nodeEnv).toBe('production');
    });

    test('should default to development when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      expect(Environment.isDevelopment).toBe(true);
      expect(Environment.nodeEnv).toBe('development');
    });
  });

  describe('getServerVar', () => {
    test('should return environment variable value', () => {
      process.env.TEST_VAR = 'test-value';
      expect(Environment.getServerVar('TEST_VAR')).toBe('test-value');
    });

    test('should return default value when variable is not set', () => {
      expect(Environment.getServerVar('NON_EXISTENT_VAR', 'default')).toBe('default');
    });

    test('should return undefined when variable is not set and no default provided', () => {
      expect(Environment.getServerVar('NON_EXISTENT_VAR')).toBeUndefined();
    });
  });

  describe('requireVar', () => {
    test('should return environment variable value when set', () => {
      process.env.REQUIRED_VAR = 'required-value';
      expect(Environment.requireVar('REQUIRED_VAR')).toBe('required-value');
    });

    test('should throw error when required variable is not set', () => {
      delete process.env.MISSING_VAR;
      expect(() => Environment.requireVar('MISSING_VAR')).toThrow(
        'Required environment variable MISSING_VAR is not set'
      );
    });

    test('should throw error when required variable is empty string', () => {
      process.env.EMPTY_VAR = '';
      expect(() => Environment.requireVar('EMPTY_VAR')).toThrow(
        'Required environment variable EMPTY_VAR is not set'
      );
    });
  });
});

describe('Server Configuration', () => {
  let originalProcessEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalProcessEnv = { ...process.env };
    // Set up minimal required environment variables
    process.env.FAL_KEY = 'test-fal-key';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
  });

  afterEach(() => {
    process.env = originalProcessEnv;
  });

  test('should return development configuration', () => {
    process.env.NODE_ENV = 'development';
    const config = getServerConfig();

    expect(config.database.logQueries).toBe(true);
    expect(config.database.connectionPoolSize).toBe(5);
    expect(config.api.enableCors).toBe(true);
    expect(config.api.rateLimit).toBe(1000);
    expect(config.fal.timeout).toBe(60000);
    expect(config.logging.level).toBe('debug');
    expect(config.logging.enableConsole).toBe(true);
  });

  test('should return production configuration', () => {
    process.env.NODE_ENV = 'production';
    const config = getServerConfig();

    expect(config.database.logQueries).toBe(false);
    expect(config.database.connectionPoolSize).toBe(20);
    expect(config.api.enableCors).toBe(false);
    expect(config.api.rateLimit).toBe(100);
    expect(config.fal.timeout).toBe(30000);
    expect(config.logging.level).toBe('info');
    expect(config.logging.enableConsole).toBe(false);
  });

  test('should use environment variables for API keys', () => {
    const config = getServerConfig();

    expect(config.fal.apiKey).toBe('test-fal-key');
    expect(config.google.clientId).toBe('test-google-client-id');
    expect(config.google.clientSecret).toBe('test-google-client-secret');
  });

  test('should throw error when required environment variables are missing', () => {
    delete process.env.FAL_KEY;

    expect(() => getServerConfig()).toThrow(
      'Required environment variable FAL_KEY is not set'
    );
  });
});