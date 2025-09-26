import { test, expect, describe } from 'vitest';
import { cn } from '../../../lib/utils';

describe('cn utility function', () => {
  test('should merge class names correctly', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
    expect(result).toContain('bg-blue-500');
  });

  test('should handle conditional classes', () => {
    const isActive = true;
    const isFocused = false;
    
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isFocused && 'focused-class'
    );
    
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
    expect(result).not.toContain('focused-class');
  });

  test('should handle tailwind class conflicts', () => {
    const result = cn('px-4 px-2');
    // twMerge should resolve conflicts and keep only the last px class
    expect(result).toBe('px-2');
  });

  test('should handle empty and undefined values', () => {
    const result = cn('base', undefined, null, '', 'final');
    expect(result).toContain('base');
    expect(result).toContain('final');
  });

  test('should handle object syntax', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
      'font-bold': true
    });
    
    expect(result).toContain('text-red-500');
    expect(result).toContain('font-bold');
    expect(result).not.toContain('text-blue-500');
  });
});