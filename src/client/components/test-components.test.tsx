import { test, expect, describe } from 'vitest';
import { screen } from '@testing-library/react';
import { renderInContext } from 'wasp/client/test';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

describe('UI Components Test Suite', () => {
  describe('Button Component', () => {
    test('renders button with text content', () => {
      renderInContext(<Button>Test Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toBeInTheDocument();
    });

    test('applies variant styles correctly', () => {
      renderInContext(<Button variant="outline">Outline Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Outline Button' });
      expect(button).toHaveClass('border', 'border-input');
    });
  });

  describe('Badge Component', () => {
    test('renders badge with content', () => {
      renderInContext(<Badge>New Feature</Badge>);
      
      const badge = screen.getByText('New Feature');
      expect(badge).toBeInTheDocument();
    });

    test('applies custom className', () => {
      renderInContext(<Badge className="custom-badge">Custom Badge</Badge>);
      
      const badge = screen.getByText('Custom Badge');
      expect(badge).toHaveClass('custom-badge');
    });
  });
});