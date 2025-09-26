import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import { requireNodeEnvVar } from '../../utils/index';

describe('Server Utils - Index', () => {
  let originalProcessEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalProcessEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalProcessEnv;
  });

  describe('requireNodeEnvVar', () => {
    test('should return environment variable value when set', () => {
      process.env.TEST_REQUIRED_VAR = 'test-value';
      expect(requireNodeEnvVar('TEST_REQUIRED_VAR')).toBe('test-value');
    });

    test('should throw error when required variable is not set', () => {
      delete process.env.MISSING_REQUIRED_VAR;
      expect(() => requireNodeEnvVar('MISSING_REQUIRED_VAR')).toThrow(
        'Required environment variable MISSING_REQUIRED_VAR is not set'
      );
    });

    test('should throw error when required variable is empty string', () => {
      process.env.EMPTY_REQUIRED_VAR = '';
      expect(() => requireNodeEnvVar('EMPTY_REQUIRED_VAR')).toThrow(
        'Required environment variable EMPTY_REQUIRED_VAR is not set'
      );
    });

    test('should handle special characters in environment variable values', () => {
      const specialValue = 'value-with@special#characters$and%numbers123';
      process.env.SPECIAL_VAR = specialValue;
      expect(requireNodeEnvVar('SPECIAL_VAR')).toBe(specialValue);
    });

    test('should handle whitespace in environment variable values', () => {
      const valueWithSpaces = '  value with spaces  ';
      process.env.SPACE_VAR = valueWithSpaces;
      expect(requireNodeEnvVar('SPACE_VAR')).toBe(valueWithSpaces);
    });
  });
});